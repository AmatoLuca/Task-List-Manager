const chalk = require('chalk');
const EventEmitter = require('events');
const readline = require('readline');
const figlet = require('figlet');


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const client = new EventEmitter();
const server = require('./server')(client);
console.log('ciao');

server.on('response', (resp) => {
  process.stdout.write('\u001B[2J\u001B[0;0f'); //special command that clear the terminal
  process.stdout.write(chalk.blackBright(figlet.textSync('Task List Manager')));
  process.stdout.write('\n\n');
  process.stdout.write(resp);
  process.stdout.write(chalk.yellow('\n\> '));
});

let command, args;
rl.on('line', (input) => {
  [command, ...args] = input.split(' ');
  client.emit('command', command, args);
});


