export class LocalStorage
{
	public static Get<T = any>(source: string, defaultValue: T|null = null): T
	{

		const item = localStorage.getItem(source);
		if (item != null)
		{
			return JSON.parse(item) as T;
		}
		if(defaultValue)
		{
			localStorage.setItem(source, JSON.stringify(defaultValue));
		}
		return defaultValue as T;
	}
	
	public static Set(source: string, value: any): void
	{
		localStorage.setItem(source, JSON.stringify(value));
	}
}