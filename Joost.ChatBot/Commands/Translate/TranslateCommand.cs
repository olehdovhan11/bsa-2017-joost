﻿using Google.Apis.Services;
using Google.Apis.Translate.v2;
using System;
using System.Threading.Tasks;
using System.Web.Configuration;

namespace Joost.ChatBot.Commands.Translate
{
	[Serializable]
	public class TranslateCommand : IBotCommand
	{
		public async Task<string> ExecuteAsync(string[] parameters)
		{
			string rez = "Can't recognize translate parameters";

			if (parameters.Length < 2)
				return rez;

			var service = new TranslateService(new BaseClientService.Initializer()
			{
				ApiKey = WebConfigurationManager.AppSettings["GoogleTranslateApiKey"],
				ApplicationName = "Joost"
			});

			string[] srcText = new[] { parameters[0] };

			try
			{
				var response = await service.Translations.List(srcText, parameters[1]).ExecuteAsync();

				if (response.Translations.Count == 0)
				{
					rez = $"Can't translate the \"{parameters[1]}\"";
				}
				else
				{
					rez = response.Translations[0].TranslatedText;
				}
			}
			catch
			{
				; // do nothing;
			}
			

			return $"<i>{rez}</i>";
		}

		public string GetCommand()
		{
			return "Translate";
		}

		public string GetDescription()
		{
			return "I can speak in many languages. You can ask me for a translation by writing something like \"Translate 'yellow submarine' to ua\"";
		}
	}
}