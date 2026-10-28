import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { parseRecords, RepairRecord } from "./domain";
const KEY = "ruodian.records.v1";
type Store = {
  records: RepairRecord[];
  reportDraft: RepairRecord | null;
  setReportDraft: (draft: RepairRecord) => void;
  ready: boolean;
  error: string;
  save: (record: RepairRecord) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reload: () => Promise<void>;
};
const Context = createContext<Store | null>(null);
export function RecordsProvider({ children }: React.PropsWithChildren) {
  const [reportDraft, setReportDraft] = useState<RepairRecord | null>(null);
  const [records, setRecords] = useState<RepairRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const current = useRef<RepairRecord[]>([]);
  const healthy = useRef(false);
  const queue = useRef<Promise<void>>(Promise.resolve());
  async function reload() {
    try {
      const items = parseRecords(await AsyncStorage.getItem(KEY));
      current.current = items;
      setRecords(items);
      healthy.current = true;
      setError("");
    } catch (e) {
      healthy.current = false;
      setError(e instanceof Error ? e.message : "读取记录失败");
    } finally {
      setReady(true);
    }
  }
  useEffect(() => {
    void reload();
  }, []);
  function mutate(update: (items: RepairRecord[]) => RepairRecord[]) {
    const task = queue.current
      .catch(() => {})
      .then(async () => {
        if (!healthy.current)
          throw new Error("记录尚未成功加载，请先重试读取，避免覆盖已有数据。");
        const next = update(current.current);
        await AsyncStorage.setItem(KEY, JSON.stringify(next));
        current.current = next;
        setRecords(next);
      });
    queue.current = task;
    return task;
  }
  return (
    <Context.Provider
      value={{
        records,
        reportDraft,
        setReportDraft,
        ready,
        error,
        reload,
        save: (record) =>
          mutate((items) => [
            record,
            ...items.filter((r) => r.id !== record.id),
          ]),
        remove: (id) => mutate((items) => items.filter((r) => r.id !== id)),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useRecords() {
  const store = useContext(Context);
  if (!store) throw new Error("缺少记录存储");
  return store;
}
