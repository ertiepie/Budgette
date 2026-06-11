import { useEffect, useRef, useState } from "react";
import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  format,
  getISOWeek,
  getYear,
  parseISO,
} from "date-fns";
import type { BudgetData } from "../types/budget";

type BackupRestoreProps = {
  data: BudgetData;
  onRestore: (data: unknown) => void;
};

type FileSystemPermissionMode = "read" | "readwrite";

type FileSystemHandlePermissionDescriptor = {
  mode?: FileSystemPermissionMode;
};

type FileSystemWritableFileStream = {
  close: () => Promise<void>;
  write: (data: BlobPart) => Promise<void>;
};

type FileSystemFileHandle = {
  createWritable: () => Promise<FileSystemWritableFileStream>;
  kind: "file";
  name: string;
};

type FileSystemDirectoryHandle = {
  getFileHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<FileSystemFileHandle>;
  kind: "directory";
  name: string;
  queryPermission?: (
    descriptor?: FileSystemHandlePermissionDescriptor,
  ) => Promise<PermissionState>;
  removeEntry: (name: string) => Promise<void>;
  requestPermission?: (
    descriptor?: FileSystemHandlePermissionDescriptor,
  ) => Promise<PermissionState>;
  values: () => AsyncIterable<FileSystemFileHandle | FileSystemDirectoryHandle>;
};

type WindowWithDirectoryPicker = Window &
  typeof globalThis & {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  };

const backupDbName = "budgette-backups";
const backupStoreName = "settings";
const backupDirectoryKey = "backup-directory";
const autoBackupPrefix = "budgette-auto-";

function createBackupPayload(data: BudgetData) {
  return {
    exportedAt: new Date().toISOString(),
    app: "Budgette",
    version: 1,
    data,
  };
}

function createBackupJson(data: BudgetData) {
  return JSON.stringify(createBackupPayload(data), null, 2);
}

function openBackupDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(backupDbName, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(backupStoreName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getStoredDirectoryHandle() {
  const db = await openBackupDb();

  return new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
    const request = db
      .transaction(backupStoreName, "readonly")
      .objectStore(backupStoreName)
      .get(backupDirectoryKey);

    request.onsuccess = () =>
      resolve((request.result as FileSystemDirectoryHandle | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function storeDirectoryHandle(handle: FileSystemDirectoryHandle) {
  const db = await openBackupDb();

  return new Promise<void>((resolve, reject) => {
    const request = db
      .transaction(backupStoreName, "readwrite")
      .objectStore(backupStoreName)
      .put(handle, backupDirectoryKey);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function ensureDirectoryPermission(
  handle: FileSystemDirectoryHandle,
  shouldRequest: boolean,
) {
  const descriptor = { mode: "readwrite" as const };
  const currentPermission = await handle.queryPermission?.(descriptor);

  if (currentPermission === "granted") {
    return true;
  }

  if (!shouldRequest) {
    return false;
  }

  return (await handle.requestPermission?.(descriptor)) === "granted";
}

function getAutoBackupDate(fileName: string) {
  const match = fileName.match(/^budgette-auto-(\d{4}-\d{2}-\d{2})\.json$/);

  if (!match) {
    return null;
  }

  return parseISO(match[1]);
}

function shouldKeepBackup(
  fileName: string,
  backupDate: Date,
  now: Date,
  weeklyBuckets: Set<string>,
  monthlyBuckets: Set<string>,
) {
  const ageInDays = differenceInCalendarDays(now, backupDate);

  if (ageInDays <= 7) {
    return true;
  }

  if (differenceInCalendarMonths(now, backupDate) <= 6) {
    const weeklyKey = `${getYear(backupDate)}-${getISOWeek(backupDate)}`;

    if (!weeklyBuckets.has(weeklyKey)) {
      weeklyBuckets.add(weeklyKey);
      return true;
    }
  }

  if (differenceInCalendarMonths(now, backupDate) <= 12) {
    const monthlyKey = format(backupDate, "yyyy-MM");

    if (!monthlyBuckets.has(monthlyKey)) {
      monthlyBuckets.add(monthlyKey);
      return true;
    }
  }

  return fileName === `${autoBackupPrefix}${format(now, "yyyy-MM-dd")}.json`;
}

async function pruneAutoBackups(directoryHandle: FileSystemDirectoryHandle) {
  const now = new Date();
  const weeklyBuckets = new Set<string>();
  const monthlyBuckets = new Set<string>();
  const backupFiles: { date: Date; name: string }[] = [];

  for await (const entry of directoryHandle.values()) {
    if (entry.kind !== "file") {
      continue;
    }

    const backupDate = getAutoBackupDate(entry.name);

    if (backupDate) {
      backupFiles.push({ date: backupDate, name: entry.name });
    }
  }

  backupFiles.sort((a, b) => b.date.getTime() - a.date.getTime());

  await Promise.all(
    backupFiles
      .filter(
        (backupFile) =>
          !shouldKeepBackup(
            backupFile.name,
            backupFile.date,
            now,
            weeklyBuckets,
            monthlyBuckets,
          ),
      )
      .map((backupFile) => directoryHandle.removeEntry(backupFile.name)),
  );
}

async function writeAutoBackup(
  directoryHandle: FileSystemDirectoryHandle,
  data: BudgetData,
) {
  const fileName = `${autoBackupPrefix}${format(new Date(), "yyyy-MM-dd")}.json`;
  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();

  await writable.write(createBackupJson(data));
  await writable.close();
  await pruneAutoBackups(directoryHandle);

  return fileName;
}

export function BackupRestore({ data, onRestore }: BackupRestoreProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [directoryHandle, setDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const supportsDirectoryPicker =
    typeof window !== "undefined" &&
    Boolean((window as WindowWithDirectoryPicker).showDirectoryPicker);

  useEffect(() => {
    let isMounted = true;

    getStoredDirectoryHandle()
      .then((handle) => {
        if (isMounted) {
          setDirectoryHandle(handle);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMessage("Could not load the saved backup folder.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!directoryHandle) {
      return;
    }

    let isMounted = true;

    ensureDirectoryPermission(directoryHandle, false)
      .then((hasPermission) => {
        if (!hasPermission) {
          if (isMounted) {
            setMessage("Backup folder needs permission again.");
          }
          return null;
        }

        return writeAutoBackup(directoryHandle, data);
      })
      .then((fileName) => {
        if (fileName && isMounted) {
          setMessage(`Auto backup saved: ${fileName}`);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setMessage(
            error instanceof Error
              ? `Auto backup failed: ${error.message}`
              : "Auto backup failed.",
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [data, directoryHandle]);

  function handleExport() {
    const fileName = `budgette-backup-${format(new Date(), "yyyy-MM-dd-HHmm")}.json`;
    const url = URL.createObjectURL(
      new Blob([createBackupJson(data)], { type: "application/json" }),
    );
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    setMessage(`Exported ${data.expenses.length} expenses.`);
  }

  async function handleChooseBackupFolder() {
    const showDirectoryPicker = (window as WindowWithDirectoryPicker)
      .showDirectoryPicker;

    if (!showDirectoryPicker) {
      setMessage("Automatic folder backups are not supported in this browser.");
      return;
    }

    try {
      const handle = await showDirectoryPicker();
      const hasPermission = await ensureDirectoryPermission(handle, true);

      if (!hasPermission) {
        setMessage("Backup folder permission was not granted.");
        return;
      }

      await storeDirectoryHandle(handle);
      setDirectoryHandle(handle);
      setMessage(`Backup folder set: ${handle.name}`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Could not set backup folder: ${error.message}`
          : "Could not set backup folder.",
      );
    }
  }

  async function handleRunAutoBackupNow() {
    if (!directoryHandle) {
      setMessage("Choose a backup folder first.");
      return;
    }

    try {
      const hasPermission = await ensureDirectoryPermission(directoryHandle, true);

      if (!hasPermission) {
        setMessage("Backup folder permission was not granted.");
        return;
      }

      const fileName = await writeAutoBackup(directoryHandle, data);

      setMessage(`Auto backup saved: ${fileName}`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Auto backup failed: ${error.message}`
          : "Auto backup failed.",
      );
    }
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const restoredData =
        parsed && typeof parsed === "object" && "data" in parsed
          ? (parsed as { data: unknown }).data
          : parsed;

      if (
        !window.confirm(
          "Restore this backup? This will replace the budget data currently stored in this browser.",
        )
      ) {
        setMessage("Restore canceled.");
        return;
      }

      onRestore(restoredData);
      setMessage(`Restored backup from ${file.name}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not restore backup.");
    }
  }

  return (
    <section className="rounded-lg border border-white/70 bg-white/75 p-4 text-sm shadow-soft backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Backup & restore
          </h2>
          <p className="mt-1 text-slate-500">
            Export manually, restore from JSON, or save rotating backups to a
            folder when Budgette is open.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Auto keeps daily backups for 7 days, weekly for 6 months, and monthly
            for 12 months.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            type="button"
            onClick={handleExport}
          >
            Export backup
          </button>
          <button
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            Restore backup
          </button>
          <button
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!supportsDirectoryPicker}
            type="button"
            onClick={handleChooseBackupFolder}
          >
            Choose backup folder
          </button>
          <button
            className="rounded-md border border-sky-200 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!directoryHandle}
            type="button"
            onClick={handleRunAutoBackupNow}
          >
            Run folder backup
          </button>
          <input
            ref={fileInputRef}
            accept="application/json,.json"
            className="hidden"
            type="file"
            onChange={handleImport}
          />
        </div>
      </div>
      {directoryHandle ? (
        <p className="mt-3 text-xs font-medium text-slate-600">
          Auto folder: {directoryHandle.name}
        </p>
      ) : null}
      {message ? <p className="mt-3 text-xs text-slate-500">{message}</p> : null}
    </section>
  );
}
