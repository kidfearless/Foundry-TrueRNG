declare var game:any;
export class Debug
{
	public static get Enabled()
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

	public static WriteLine(message:any, ...params:any[])
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

	public static Group(message)
	{
		if (Debug.Enabled)
		{
			console.group(message);
		}
	}

	public static GroupCollapsed(message)
	{
		if (Debug.Enabled)
		{
			console.groupCollapsed(message);
		}
	}
	public static GroupEnd()
	{
		if (Debug.Enabled)
		{
			console.groupEnd();
		}
	}
}
