export declare class LocalStorage {
    static Get<T = any>(source: string, defaultValue?: T | null): T;
    static Set(source: string, value: any): void;
}
