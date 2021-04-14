export declare class Hooks {
    static _hooks: {};
    static _once: [];
    static _ids: {};
    static _id: number;
    static on(hook: string, fn: Function): number;
    static once(hook: string, fn: Function): number;
    static off(hook: string, fn: Function | number): any;
    static callAll(hook: string, ...args: any[]): any;
    static call(hook: string, ...args: any[]): any;
    static _call(hook: string, fn: number | Function, args: any[]): any;
}
