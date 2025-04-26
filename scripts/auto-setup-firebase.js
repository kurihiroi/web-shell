#!/usr/bin/env node

/**
 * Firebase自動セットアップスクリプト
 * 
 * 使用法:
 * node auto-setup-firebase.js <プロジェクトID>
 * 
 * 必要な環境:
 * - Node.js 14以上
 * - firebase-admin パッケージ
 * - Firebase CLIがインストールされ、ログイン済み
 * - プロジェクトのサービスアカウント権限を持つユーザー
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// コンソール出力の色設定
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// ユーザー入力用のreadline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// プロジェクトルートパス
const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_FILE_PATH = path.join(ROOT_DIR, 'apps/web/.env.local');

// ヘルパー関数
const log = {
  info: (msg) => console.log(`${colors.blue}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}${msg}${colors.reset}`),
};

// npmパッケージがインストールされているか確認
function checkPackageInstalled(packageName) {
  try {
    require.resolve(packageName);
    return true;
  } catch (e) {
    return false;
  }
}

// 質問して答えを取得
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// firebase-adminとプロジェクトIDの存在を確認
async function checkPrerequisites() {
  // コマンドライン引数からプロジェクトIDを取得
  const projectId = process.argv[2];
  
  if (!projectId) {
    log.error('プロジェクトIDが指定されていません。');
    log.info('使用法: node auto-setup-firebase.js <プロジェクトID>');
    
    try {
      log.info('\n利用可能なプロジェクト:');
      execSync('firebase projects:list', { stdio: 'inherit' });
    } catch (error) {
      log.error('Firebaseプロジェクトリストの取得に失敗しました。');
    }
    
    process.exit(1);
  }
  
  // firebase-adminパッケージがインストールされているか確認
  if (!checkPackageInstalled('firebase-admin')) {
    log.warn('firebase-adminパッケージがインストールされていません。インストールしますか？ (y/n)');
    const answer = await askQuestion('> ');
    
    if (answer.toLowerCase() === 'y') {
      try {
        log.info('firebase-adminをインストールしています...');
        execSync('npm install --no-save firebase-admin', { stdio: 'inherit' });
      } catch (error) {
        log.error('firebase-adminのインストールに失敗しました。');
        process.exit(1);
      }
    } else {
      log.error('firebase-adminは必須です。インストールせずに続行できません。');
      process.exit(1);
    }
  }

  return projectId;
}

// Firebaseの設定を.env.localファイルに保存
function saveEnvFile(config, projectId) {
  const envContent = `# Firebase設定
# 自動生成: ${new Date().toISOString()}
# プロジェクトID: ${projectId}

VITE_FIREBASE_API_KEY=${config.apiKey}
VITE_FIREBASE_AUTH_DOMAIN=${config.authDomain}
VITE_FIREBASE_PROJECT_ID=${projectId}
VITE_FIREBASE_STORAGE_BUCKET=${config.storageBucket}
VITE_FIREBASE_MESSAGING_SENDER_ID=${config.messagingSenderId}
VITE_FIREBASE_APP_ID=${config.appId}
`;

  // ディレクトリが存在するか確認し、なければ作成
  const dir = path.dirname(ENV_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // .env.localファイルに書き込み
  fs.writeFileSync(ENV_FILE_PATH, envContent);
  log.success(`Firebase設定を ${ENV_FILE_PATH} に保存しました。`);
}

// アプリがプロジェクトに存在するか確認し、なければ作成
async function ensureWebAppExists(admin, projectId) {
  try {
    const projectManagement = admin.projectManagement();
    const apps = await projectManagement.listAppMetadata();
    
    // Webアプリを検索
    const webApp = apps.find(app => app.platform === 'WEB');
    
    if (webApp) {
      log.info(`既存のWebアプリを使用します: ${webApp.displayName || 'No name'}`);
      return webApp.appId;
    }
    
    // Webアプリがなければ作成
    log.info('Webアプリが見つかりませんでした。新しいWebアプリを作成します...');
    const displayName = await askQuestion('アプリの表示名を入力してください: ');
    
    const newApp = await projectManagement.createWebApp(displayName || 'Web App');
    log.success(`新しいWebアプリを作成しました: ${newApp.displayName}`);
    return newApp.appId;
    
  } catch (error) {
    log.error('Webアプリの確認/作成中にエラーが発生しました:');
    console.error(error);
    throw error;
  }
}

// メイン関数
async function main() {
  try {
    // 前提条件の確認
    const projectId = await checkPrerequisites();
    
    log.info(`プロジェクト ${projectId} の設定を取得しています...`);
    
    // firebase-adminモジュールを動的にロード
    const admin = require('firebase-admin');
    
    // サービスアカウントの認証情報を取得
    log.info('Firebase認証情報を取得しています...');
    
    try {
      // サービスアカウント情報を直接使用
      admin.initializeApp({
        projectId: projectId,
        credential: admin.credential.applicationDefault()
      });
    } catch (error) {
      log.error('Firebase認証に失敗しました。');
      log.warn('サービスアカウントキーファイルが必要です。');
      log.info(`1. https://console.firebase.google.com/project/${projectId}/settings/serviceaccounts/adminsdk にアクセス`);
      log.info('2. 「新しい秘密鍵の生成」ボタンをクリック');
      log.info('3. ダウンロードしたJSONファイルのパスを入力');
      
      const keyFilePath = await askQuestion('サービスアカウントキーのJSONファイルパス: ');
      
      if (!fs.existsSync(keyFilePath)) {
        log.error('ファイルが見つかりません。');
        process.exit(1);
      }
      
      // 環境変数に設定
      process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFilePath;
      
      // 再初期化
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: projectId
      });
    }
    
    // Webアプリの存在確認または作成
    const appId = await ensureWebAppExists(admin, projectId);
    
    // プロジェクト設定を取得
    log.info('プロジェクト設定を取得しています...');
    const projectConfig = await admin.projectManagement().getProjectConfig();
    
    // アプリ設定を取得
    const [appConfig] = await admin.projectManagement().listAppMetadata();
    
    // Firebase構成情報を作成
    const firebaseConfig = {
      apiKey: projectConfig.apiKey,
      authDomain: `${projectId}.firebaseapp.com`,
      projectId: projectId,
      storageBucket: `${projectId}.appspot.com`,
      messagingSenderId: projectConfig.messagingSenderId,
      appId: appId
    };
    
    // .env.localファイルに保存
    saveEnvFile(firebaseConfig, projectId);
    
    // Google認証プロバイダーを有効にする
    log.info('Google認証プロバイダーを確認しています...');
    
    try {
      // Auth設定を取得
      const authSettings = await admin.auth().getProviderConfig('saml.google.com');
      log.success('Google認証プロバイダーはすでに設定されています。');
    } catch (error) {
      log.warn('Google認証プロバイダーを有効にするには、Firebase Consoleでの手動設定が必要です:');
      log.info(`https://console.firebase.google.com/project/${projectId}/authentication/providers`);
      log.info('1. 「新しいプロバイダを追加」→「Google」を選択');
      log.info('2. 「プロバイダを有効にする」をオンにする');
      log.info('3. プロジェクトのサポートメールを設定する');
      log.info('4. 「保存」をクリックする');
    }
    
    log.success('すべての設定が完了しました！');
    log.info('アプリケーションを起動するには: cd apps/web && pnpm dev');
    
  } catch (error) {
    log.error('エラーが発生しました:');
    console.error(error);
  } finally {
    rl.close();
  }
}

// スクリプト実行
main();