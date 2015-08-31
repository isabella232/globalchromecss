/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const kCID  = Components.ID('{3ae77670-28cc-11dd-bd0b-0800200c9a66}'); 
const kID   = '@clear-code.com/globalchromecss/startup;1';
const kNAME = 'GlobalChromeCSSStartupService';

const ObserverService = Components
		.classes['@mozilla.org/observer-service;1']
		.getService(Components.interfaces.nsIObserverService);

const SSS = Components
		.classes['@mozilla.org/content/style-sheet-service;1']
		.getService(Components.interfaces.nsIStyleSheetService);

const IOService = Components
		.classes['@mozilla.org/network/io-service;1']
		.getService(Components.interfaces.nsIIOService);

const DirectoryService = Components
		.classes['@mozilla.org/file/directory_service;1']
		.getService(Components.interfaces.nsIProperties);

Components.utils.import('resource://gre/modules/Services.jsm');

function log(aMessage) {
  if (!Services.prefs.getBoolPref('extensions.globalchromecss@clear-code.com.debug'))
    return;
  Components
	.classes['@mozilla.org/consoleservice;1']
    .getService(Components.interfaces.nsIConsoleService)
    .logStringMessage(aMessage);
}
 
function GlobalChromeCSSStartupService() { 
}
GlobalChromeCSSStartupService.prototype = {
	classID          : kCID,
	contractID       : kID,
	classDescription : kNAME,
	 
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'app-startup':
			case 'profile-after-change':
				ObserverService.addObserver(this, 'final-ui-startup', false);
				return;

			case 'final-ui-startup':
				ObserverService.removeObserver(this, 'final-ui-startup');
				this.init();
				return;
		}
	},
 
	init : function() 
	{
		this.registerGlobalStyleSheets();
	},
 
	registerGlobalStyleSheets : function() 
	{
		var applicationChrome = DirectoryService.get('AChrom', Components.interfaces.nsIFile);
		this.registerGlobalStyleSheetsIn(applicationChrome);

		var globalChrome = DirectoryService.get('GreD', Components.interfaces.nsIFile);
		globalChrome = globalChrome.clone();
		globalChrome.append('chrome');
		this.registerGlobalStyleSheetsIn(globalChrome);
	},
	registerGlobalStyleSheetsIn : function(aChromeDirectory) 
	{
		if (!aChromeDirectory.exists()) {
			Components.utils.reportError(new Error('[globalchromecss] "' + aChromeDirectory.path + '" does not exist.'));
			return;
		}
		if (!aChromeDirectory.isDirectory()) {
			Components.utils.reportError(new Error('[globalchromecss] "' + aChromeDirectory.path + '" is not a directory.'));
			return;
		}

		var files = aChromeDirectory.directoryEntries;
		var file;
		var sheet;
		var count = 0;
		while (files.hasMoreElements())
		{
			file = files.getNext().QueryInterface(Components.interfaces.nsIFile);
			if (!file.isFile() || !/\.css$/i.test(file.leafName))
				continue;
			let sheet = IOService.newFileURI(file);
			if (!SSS.sheetRegistered(sheet, SSS.USER_SHEET)) {
				log('[globalchromecss] register stylesheet: ' + file.path);
				SSS.loadAndRegisterSheet(sheet, SSS.USER_SHEET);
				count++;
			}
		}
		if (count == 0)
		  log('[globalchromecss] there is no stylesheet to be registered in ' + aChromeDirectory.path);
	},
	
  
	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(Components.interfaces.nsIObserver) &&
			!aIID.equals(Components.interfaces.nsISupports)) {
			throw Components.results.NS_ERROR_NO_INTERFACE;
		}
		return this;
	}
 
}; 
 	 
var gModule = { 
	registerSelf : function(aCompMgr, aFileSpec, aLocation, aType)
	{
		aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		aCompMgr.registerFactoryLocation(
			kCID,
			kNAME,
			kID,
			aFileSpec,
			aLocation,
			aType
		);

		var catMgr = Components.classes['@mozilla.org/categorymanager;1']
					.getService(Components.interfaces.nsICategoryManager);
		catMgr.addCategoryEntry('app-startup', kNAME, kID, true, true);
	},

	getClassObject : function(aCompMgr, aCID, aIID)
	{
		return this.factory;
	},

	factory : {
		QueryInterface : function(aIID)
		{
			if (!aIID.equals(Components.interfaces.nsISupports) &&
				!aIID.equals(Components.interfaces.nsIFactory)) {
				throw Components.results.NS_ERROR_NO_INTERFACE;
			}
			return this;
		},
		createInstance : function(aOuter, aIID)
		{
			return new GlobalChromeCSSStartupService();
		}
	},

	canUnload : function(aCompMgr)
	{
		return true;
	}
};

try {
	Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');
	var NSGetFactory = XPCOMUtils.generateNSGetFactory([GlobalChromeCSSStartupService]);
}
catch(e) {
	var NSGetModule = function(aCompMgr, aFileSpec) {
			return gModule;
		};
}
 
