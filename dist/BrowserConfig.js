export class LocalStorage {
    static Get(source, defaultValue = null) {
        const item = localStorage.getItem(source);
        if (item != null) {
            return JSON.parse(item);
        }
        if (defaultValue) {
            localStorage.setItem(source, JSON.stringify(defaultValue));
        }
        return defaultValue;
    }
    static Set(source, value) {
        localStorage.setItem(source, JSON.stringify(value));
    }
}
//# sourceMappingURL=BrowserConfig.js.map