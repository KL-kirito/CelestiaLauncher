const { ipcRenderer } = require('electron');
const path = require('path');

let appPath, resPath, fileStats, launcherConf, confPath = 'conf/config.json';

let CmdDialog = {
    dialog: new mdui.Dialog('#CmdDialog', { modal: true }),
    content: document.getElementById('CmdContent'),
    log: document.getElementById('CmdLog'),
    confirmBtn: document.getElementById('CmdConfirmBtn')
};

let Elements = {
    autoUpdate: document.getElementById('AutoUpdate'),
    useMongoService: document.getElementById('UseMongoService'),
    useJDKPath: document.getElementById('UseJDKPath'),
    useGitPath: document.getElementById('UseGitPath'),
    resetConfig: document.getElementById('ResetConfig'),
    removeall: document.getElementById('RemoveAll')
};

window.onload = function () {
    ipcRenderer.send('GetAppPath', {});
    ipcRenderer.once('ReturnAppPath', (event, args) => {
        appPath = args.ProgramPath;
        resPath = args.ResourcesPath;
        console.log(appPath);
        ipcRenderer.send('ReadJson', { Path: path.join(resPath, confPath) });
        ipcRenderer.once('JsonContent', (event, args) => {
            launcherConf = args.Obj;
            launcherConf.AutoUpdate ? Elements.autoUpdate.setAttribute('checked', true) : {};
            launcherConf.UseMongoService ? Elements.useMongoService.setAttribute('checked', true) : {};
            launcherConf.UseJDKPath ? Elements.useJDKPath.setAttribute('checked', true) : {};
            launcherConf.UseGitPath ? Elements.useGitPath.setAttribute('checked', true) : {};
        });
        ipcRenderer.send('GetStats', {});
        ipcRenderer.once('StatsReturn', (event, args) => {
            fileStats = args.Stats;
        });
    });
};

function Caution(message) {
    mdui.snackbar({ message: message, position: 'left-bottom' });
}

function WriteConf() {
    ipcRenderer.send('WriteJson', { Path: path.join(resPath, confPath), Obj: launcherConf });
}

function AsyncSysCmd(title, command, cwd) {
    CmdDialog.dialog.open();
    CmdDialog.content.innerHTML = title;
    let currentCwd = path.join(appPath, 'game', cwd);
    ipcRenderer.send('DoCmd', { Cmds: command, Cwd: currentCwd });
    ipcRenderer.on('CmdLog', (event, args) => {
        console.log(args.Data);
        CmdDialog.log.innerHTML += args.Data;
    });
    ipcRenderer.once('CmdReturn', (event, args) => {
        CmdDialog.confirmBtn.removeAttribute('disabled');
        ipcRenderer.removeAllListeners('CmdLog');
        if (args.Error == null) {
            CmdDialog.log.innerHTML = 'Success.\n' + args.Return;
            Caution('????????????');
        } else {
            CmdDialog.log.innerHTML += 'Execute failed. Exit because of ' + args.Error;
            console.error(args.Error);
            Caution('????????????');
        }
    });
}

function RemoveAll() {
    let commands = ['cd .\\'];
    if (fileStats.hasJDK) { commands.push('rd /q /s .\\jdk-17.0.3+7'); }
    if (fileStats.hasMongo) {
        commands.push('rd /q /s .\\mongodb-win32-x86_64-windows-5.0.8\\bin');
        commands.push('del /q /s .\\mongodb-win32-x86_64-windows-5.0.8\\data\\*.*');
    }
    if (fileStats.hasGit) { commands.push('rd /q /s .\\git'); }
    if (fileStats.hasGC) { commands.push('rd /q /s .\\Grasscutter'); }
    if (fileStats.hasGCR) { commands.push('rd /q /s .\\Grasscutter_Resources'); }
    AsyncSysCmd(
        '????????????????????????...',
        commands,
        ''
    );
}

Elements.autoUpdate.addEventListener('click', () => {
    if (Elements.autoUpdate.checked) {
        Caution('?????????????????????Git???????????????????????????????????????????????????????????????????????????????????????????????????');
        launcherConf.AutoUpdate = true;
        WriteConf();
    } else {
        launcherConf.AutoUpdate = false;
        WriteConf();
    }
});

Elements.useMongoService.addEventListener('click', () => {
    if (Elements.useMongoService.checked) {
        Caution('??????????????????????????????????????????MongoDB?????????');
        launcherConf.UseMongoService = true;
        WriteConf();
    } else {
        launcherConf.UseMongoService = false;
        WriteConf();
    }
});

Elements.useJDKPath.addEventListener('click', () => {
    if (Elements.useJDKPath.checked) {
        Caution('?????????????????????JDK17?????????JDK????????????????????????Path???JAVA_HOME???');
        launcherConf.UseJDKPath = true;
        WriteConf();
    } else {
        launcherConf.UseJDKPath = false;
        WriteConf();
    }
});

Elements.useGitPath.addEventListener('click', () => {
    if (Elements.useGitPath.checked) {
        Caution('??????????????????Git??????????????????');
        launcherConf.UseGitPath = true;
        WriteConf();
    } else {
        launcherConf.UseGitPath = false;
        WriteConf();
    }
});

Elements.resetConfig.addEventListener('click', () => {
    ipcRenderer.send('ReadJson', { Path: path.join(resPath, 'conf/defaultconfig.json') });
    ipcRenderer.once('JsonContent', (event, args) => {
        ipcRenderer.send('WriteJson', { Path: path.join(resPath, confPath), Obj: args.Obj });
        location.reload();
    });
});

Elements.removeall.addEventListener('click', () => {
    mdui.snackbar({
        message: '?????????????????????????????????????????????',
        buttonText: '??????',
        onButtonClick: function () {
            RemoveAll();
        }
    });
});

