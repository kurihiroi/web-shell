import { type FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import type { Command } from '../../models/CommandHistory';
import { createCommandHistoryRepository } from '../../repositories/CommandHistoryRepository';
import './Shell.css';

export default function Shell() {
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<Command[]>([]);
  const [output, setOutput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { user } = useAuth();
  const commandRepo = createCommandHistoryRepository(db);

  // コマンド履歴を取得
  useEffect(() => {
    const fetchCommandHistory = async () => {
      if (!user) return;

      try {
        const history = await commandRepo.findAll();
        // 新しいコマンドを先頭に表示するよう並び替え
        setCommandHistory(
          history
            .map((item) => ({
              command: item.command,
              timestamp: item.clientTimestamp,
              userId: item.userId,
              status: item.status as 'success' | 'error' | 'pending',
              output: item.output,
              workingDirectory: item.workingDirectory,
            }))
            .sort((a, b) => {
              const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
              const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
              return dateB.getTime() - dateA.getTime();
            })
        );
      } catch (error) {
        console.error('Error fetching command history:', error);
        setOutput((prev) => `${prev}\nError fetching command history.`);
      }
    };

    fetchCommandHistory();
  }, [user, commandRepo]);

  // コマンドを実行
  const executeCommand = async (e: FormEvent) => {
    e.preventDefault();

    if (!command.trim()) return;

    setIsProcessing(true);
    setOutput((prev) => `${prev}\n$ ${command}`);

    // 新規コマンドを作成
    const newCommand: Command = {
      command: command.trim(),
      timestamp: new Date(),
      userId: user?.uid,
      status: 'pending',
      workingDirectory: '/',
    };

    try {
      // ここではダミーの実行結果を生成
      // 実際のシェルコマンド実行は別の機能で実装する
      const dummyOutput = `Executed command: ${command}`;
      setOutput((prev) => `${prev}\n${dummyOutput}`);

      // 実行状態を更新
      newCommand.status = 'success';
      newCommand.output = dummyOutput;

      // Firestoreに保存
      if (user) {
        await commandRepo.create(newCommand);

        // 履歴を更新
        setCommandHistory((prev) => [newCommand, ...prev]);
      }
    } catch (error) {
      console.error('Error executing command:', error);
      setOutput(
        (prev) => `${prev}\nError: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      // エラー状態を更新
      newCommand.status = 'error';
      newCommand.output = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;

      // エラー状態もFirestoreに保存
      if (user) {
        await commandRepo.create(newCommand);
      }
    } finally {
      setCommand('');
      setIsProcessing(false);
    }
  };

  // 履歴からコマンドを選択
  const selectCommand = (cmd: string) => {
    setCommand(cmd);
  };

  return (
    <div className="shell-container">
      <div className="shell-output">
        <pre>{output || 'Welcome to Web Shell. Type a command and press Enter.'}</pre>
      </div>

      <form onSubmit={executeCommand} className="shell-input-form">
        <div className="shell-prompt">$</div>
        <input
          type="text"
          className="shell-input"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Enter command..."
          disabled={isProcessing || !user}
        />
        <button type="submit" className="shell-button" disabled={isProcessing || !user}>
          Execute
        </button>
      </form>

      {user && commandHistory.length > 0 && (
        <div className="command-history">
          <h4>Command History</h4>
          <div className="history-items">
            {commandHistory.map((cmd, index) => (
              <button
                key={`cmd-${cmd.command}-${index}`}
                className={`history-item status-${cmd.status}`}
                onClick={() => selectCommand(cmd.command)}
                type="button"
              >
                <span className="history-command">{cmd.command}</span>
                <span className="history-time">
                  {cmd.timestamp ? new Date(cmd.timestamp).toLocaleString() : 'Unknown time'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!user && (
        <div className="auth-warning">
          Please sign in to use the shell and save command history.
        </div>
      )}
    </div>
  );
}
