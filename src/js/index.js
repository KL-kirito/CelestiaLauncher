var ipc = require('electron').ipcRenderer;
var shell = require('electron').shell;
var path = require('path');
var fs = require('fs');
var { exec } = require('child_process');
var $ = mdui.$;
var jarSelect = new mdui.Select('#JarSelect');
var appPath, stats, config, confPath = 'conf/config.json';
var jarPath = [];

window.onload = function () {
    ipc.send('GetAppPath', {});
    ipc.once('ReturnAppPath', (event, args) => {
        appPath = args.Path;
        console.log(appPath);
        let filePath = path.join(appPath, 'resources\\Grasscutter');

        fs.readdir(filePath, function (err, files) {
            if (!err) {
                files.forEach(function (fileName) {
                    let fileDir = path.join(filePath, fileName);
                    fs.stat(fileDir, function (err, stats) {
                        if (!err) {
                            let isFile = stats.isFile();
                            if (isFile && path.extname(fileDir) == '.jar') {
                                let value = jarPath.push(fileDir);
                                $('#JarSelect').append('<option value="' + value + '">' + fileName + '</option>');
                                jarSelect.handleUpdate();
                                console.log(jarPath.toString());
                            }
                        }
                    });
                });
            }
        });
    });
    ipc.send('ReadConf', { Path: confPath });
    ipc.once('ConfContent', (event, args) => {
        config = args.Obj;
        UpdateStats();
    });
};

function UpdateStats() {
    ipc.send('GetStats', {});
    ipc.once('StatsReturn', (event, args) => {
        stats = args.Stats;
        if ((stats.hasJDK || config.UseJDKPath) && (stats.hasMongo || config.UseMongoService)) {
            document.getElementById('LaunchGame').removeAttribute('disabled');
        } else {
            document.getElementById('LaunchGame').setAttribute('disabled', 'true');
        }
    });
}

document.getElementById('LaunchGame').addEventListener('click', () => {
    let mongoPath = path.join(appPath, 'resources\\launchmongo.bat');
    let launchPath = path.join(appPath, 'resources\\launchgame.bat');
    let jdkPath = path.join(appPath, 'resources\\jdk-17.0.3+7\\bin\\java.exe');
    let value = document.getElementById('JarSelect').selectedIndex;
    let launchContent = '@echo off\ncd .\\Grasscutter\\\n' +
        (config.UseJDKPath ? 'java' : jdkPath) +
        ' -jar ' + jarPath[value];
    fs.writeFileSync(launchPath, launchContent);
    config.UseMongoService ? {} : shell.openPath(mongoPath);
    setTimeout(() => {
        shell.openPath(launchPath);
    }, 1000);
});

/*
setTimeout(() => {
    let card = document.getElementById('GCCommandCard');
    let sendBtn = document.getElementById('GCSend');
    card.setAttribute('class', 'mdui-card mdui-hoverable');
    let run = exec(launchContent, {
        cwd: path.join(appPath, 'resources/Grasscutter'),
        maxBuffer: Infinity,
        encoding: 'gbk'
    }, (e, o, se) => {
        card.setAttribute('class', 'mdui-card mdui-hoverable mdui-hidden');
        document.getElementById('GCLog').innerHTML = '';
        sendBtn.removeEventListener('click', SendGCMessage());
        clearInterval(upd);
    });
    sendBtn.addEventListener('click', SendGCMessage());
    function SendGCMessage() {
        let sendCmd = document.getElementById('GCCommand').value;
        console.log(sendCmd);
        run.stdin.write(sendCmd, (err) => { console.error(err); });
    }
    function UpdateLog() {
        run.stdout.on('data', (data) => {
            document.getElementById('GCLog').innerHTML += data;
            document.getElementById('GCLog').scroll({
                top: document.getElementById('GCLog').clientHeight,
                left: 0
            });
        });
    }
    let upd = setInterval(UpdateLog(), 100);
}, 1000);
*/