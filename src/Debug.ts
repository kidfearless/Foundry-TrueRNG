declare var game:any;
export class Debug
{
	public static get Enabled(): boolean
	{
		try
		{
			return game.settings.get("TrueRNG", "DEBUG");
		}
		catch
		{
			return true;
		}
	}

	public static WriteLine(message:any, ...params:any[]): void
	{
		if (Debug.Enabled)
		{
			if(params.length)
			{
				console.log("TrueRNG | " + message, params);
			}
			else
			{
				console.log("TrueRNG | " + message);
			}
		}
	}

	public static Group(message:any):void
	{
		if (Debug.Enabled)
		{
			console.group(message);
		}
	}

	public static GroupCollapsed(message: any):void
	{
		if (Debug.Enabled)
		{
			console.groupCollapsed(message);
		}
	}
	public static GroupEnd():void
	{
		if (Debug.Enabled)
		{
			console.groupEnd();
		}
	}
}
