{// globalChrome.css, for Firefox 52/Thunderbird 52 and later
  let { classes: Cc, interfaces: Ci, utils: Cu } = Components;
  let { Services } = Cu.import('resource://gre/modules/Services.jsm', {});
  const SSS = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
  let log = (aMessage) => {
    if (Services.prefs.getBoolPref('extensions.globalchromecss@clear-code.com.debug'))
      Services.console.logStringMessage(aMessage);
  }
  Services.obs.addObserver({
    observe(aSubject, aTopic, aData) {
      var applicationChrome = Services.dirsvc.get('AChrom', Ci.nsIFile);
      this.registerGlobalStyleSheetsIn(applicationChrome);
      var globalChrome = Services.dirsvc.get('GreD', Ci.nsIFile);
      globalChrome = globalChrome.clone();
      globalChrome.append('chrome');
      this.registerGlobalStyleSheetsIn(globalChrome);
    },
    registerGlobalStyleSheetsIn(aChromeDirectory) {
      if (!aChromeDirectory.exists()) {
        log(`[globalchromecss] ${aChromeDirectory.path} does not exist.`);
        return;
      }
      if (!aChromeDirectory.isDirectory()) {
        log(`[globalchromecss] ${aChromeDirectory.path} is not a directory.`);
        return;
      }
      var files = aChromeDirectory.directoryEntries;
      var file;
      var sheet;
      var count = 0;
      while (files.hasMoreElements()) {
        file = files.getNext().QueryInterface(Ci.nsIFile);
        if (!file.isFile() || !/\.css$/i.test(file.leafName))
          continue;
        let sheet = Services.io.newFileURI(file);
        if (!SSS.sheetRegistered(sheet, SSS.USER_SHEET)) {
          log(`[globalchromecss] register stylesheet: ${file.path}`);
          SSS.loadAndRegisterSheet(sheet, SSS.USER_SHEET);
          count++;
        }
      }
      if (count == 0)
        log(`[globalchromecss] there is no stylesheet to be registered in ${aChromeDirectory.path}`);
    }
  }, 'final-ui-startup', false);
}
