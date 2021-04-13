declare var game:any;
export class Debug
{
	public static get Enabled()
	{
		return game.settings.get("TrueRNG", "DEBUG");
	}

	public static WriteLine(message, ...params)
	{
		if (Debug.Enabled)
		{
			console.log(message, params);
		}
	}

	public static Group(message)
	{
		if (Debug.Enabled)
		{
			console.group(message);
		}
	}

	public static GroupCollapsed(message, ...params)
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
