import { type FormEvent, useEffect, useState } from 'react';
import { BsTerminal } from 'react-icons/bs';
import { FaExclamationTriangle, FaHistory } from 'react-icons/fa';
import { IoMdSend } from 'react-icons/io';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import type { Command } from '../../models/CommandHistory';
import { createCommandHistoryRepository } from '../../repositories/CommandHistoryRepository';

export default function Shell() {
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<Command[]>([]);
  const [output, setOutput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandRepo, setCommandRepo] = useState<ReturnType<
    typeof createCommandHistoryRepository
  > | null>(null);

  const { user } = useAuth();

  // Firestore repository の初期化
  useEffect(() => {
    if (db) {
      try {
        setCommandRepo(createCommandHistoryRepository(db));
      } catch (error) {
        console.error('Failed to initialize command repository:', error);
        setOutput((prev) => `${prev}\nError: Could not initialize command history.`);
      }
    }
  }, []);

  // コマンド履歴を取得
  useEffect(() => {
    const fetchCommandHistory = async () => {
      if (!user || !db || !commandRepo) return;

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

    // Firestoreが利用可能な場合のみ履歴を取得
    if (db && commandRepo) {
      fetchCommandHistory();
    } else if (!db) {
      console.warn('Firestore is not available. Command history will not be loaded.');
    }
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

      // Firestoreに保存（利用可能な場合のみ）
      if (user && db && commandRepo) {
        try {
          await commandRepo.create(newCommand);
        } catch (dbError) {
          console.error('Failed to save command to Firestore:', dbError);
        }
      }

      // UIに追加
      setCommandHistory((prev) => [newCommand, ...prev]);
    } catch (error) {
      console.error('Error executing command:', error);
      setOutput(
        (prev) => `${prev}\nError: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      // エラー状態を更新
      newCommand.status = 'error';
      newCommand.output = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;

      // エラー状態もFirestoreに保存（利用可能な場合のみ）
      if (user && db && commandRepo) {
        try {
          await commandRepo.create(newCommand);
        } catch (dbError) {
          console.error('Failed to save error command to Firestore:', dbError);
        }
      }

      // UIに追加
      setCommandHistory((prev) => [newCommand, ...prev]);
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
    <div className="w-full max-w-3xl mx-auto bg-gray-900 rounded-lg overflow-hidden shadow-lg text-gray-100">
      <div className="p-3 min-h-[200px] max-h-[400px] overflow-y-auto bg-black font-mono text-sm leading-relaxed">
        <pre className="m-0 whitespace-pre-wrap break-words">
          {output || 'Welcome to Web Shell. Type a command and press Enter.'}
        </pre>
      </div>

      <form onSubmit={executeCommand} className="flex p-2 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center px-2 text-green-500 font-bold font-mono">
          <BsTerminal className="mr-1" />$
        </div>
        <input
          type="text"
          className="flex-1 bg-transparent border-none text-gray-100 font-mono text-sm p-2 outline-none"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Enter command..."
          disabled={isProcessing || !user}
        />
        <button
          type="submit"
          className="bg-green-600 text-white border-none rounded px-4 py-2 font-bold transition-colors hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center"
          disabled={isProcessing || !user}
        >
          <IoMdSend className="mr-1" />
          Execute
        </button>
      </form>

      {user && commandHistory.length > 0 && (
        <div className="p-2 px-4 bg-gray-800 border-t border-gray-700">
          <h4 className="my-2 text-gray-400 text-sm flex items-center">
            <FaHistory className="mr-2" />
            Command History
          </h4>
          <div className="p-0 m-0 max-h-[150px] overflow-y-auto">
            {commandHistory.map((cmd, index) => (
              <button
                key={`cmd-${cmd.command}-${index}`}
                className={`flex justify-between w-full p-2 cursor-pointer border-none border-b border-gray-700 bg-transparent text-gray-100 text-left transition-colors hover:bg-gray-700 ${
                  cmd.status === 'success'
                    ? 'border-l-4 border-l-green-500'
                    : cmd.status === 'error'
                      ? 'border-l-4 border-l-red-500'
                      : 'border-l-4 border-l-yellow-500'
                }`}
                onClick={() => selectCommand(cmd.command)}
                type="button"
              >
                <span className="font-mono text-xs max-w-[70%] overflow-hidden text-ellipsis whitespace-nowrap">
                  {cmd.command}
                </span>
                <span className="text-xs text-gray-400">
                  {cmd.timestamp ? new Date(cmd.timestamp).toLocaleString() : 'Unknown time'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!user && (
        <div className="p-3 text-center bg-gray-800 border-t border-gray-700 text-yellow-500 text-sm flex items-center justify-center">
          <FaExclamationTriangle className="mr-2" />
          Please sign in to use the shell and save command history.
        </div>
      )}
    </div>
  );
}
