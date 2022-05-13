const { ipcMain, app } = require('electron');
const { spawn, exec } = require('child_process');
const path = require('path');
const cmd = require('node-cmd');

exports.initCmd = function (win) {
    ipcMain.on('DoFileCommand', (event, args) => {
        let file = path.join(app.getAppPath(), 'resources', args.Path);
        let cwd = path.join(app.getAppPath(), 'resources')
        let cmdArgs = args.Other.split(' ');
        const child = spawn(file, cmdArgs, {
            cwd: cwd,
            shell: true,
            encoding: 'gbk'
        });
        child.stdout.on('data', (data) => {
            win.webContents.send('FileCommandLog', {
                Log: data
            });
        });
        child.on('exit', (code, signal) => {
            win.webContents.send('FileCommandReturn', {
                Return: code
            });
        });
    })
    ipcMain.on('DoSysCommand', (event, args) => {
        let cwd = path.join(app.getAppPath(), 'resources');
        let run = cmd.runSync(args.Command);
        win.webContents.send('CommandReturn', {
            Return: run.data,
            Error: run.err,
            Stderr: run.stderr
        });
    })
}