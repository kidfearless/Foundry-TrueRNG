export declare class Debug {
    static get Enabled(): boolean;
    static WriteLine(message: any, ...params: any[]): void;
    static Group(message: any): void;
    static GroupCollapsed(message: any): void;
    static GroupEnd(): void;
    static Assert(value: any, ...params: any[]): void;
}
