const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const figlet = require('figlet');


class Server extends EventEmitter {
  constructor(client) {
    super();
    this.tasks = {}; // hold the tasks added
    this.taskId = 1; // unique id for every task 
    process.nextTick(() => {
      this.emit(
        'response', 
        chalk.green('Type a command (help to list commands)\n')
      );
    });
    client.on('command', (command, args) => {
      switch (command) {
        case 'help':
        case 'add':
        case 'ls':
        case 'delete':
        case 'save':
        case 'directory':
          this[command](args);
          break;
        default:
          this.emit('response', chalk.redBright('Unknown command...\n'));
          break;
      }
    });
  }

  taskString() {
    return Object.keys(this.tasks).map(key => {
      return `${key}: ${this.tasks[key]}`;
    }).join('\n');
  } // end taskString method ___________________________________________________________________

  whiteSpaceController(input) {
    let inputStringfy = input.join(' '); 
    let isBlank = true;
    let totalElements = inputStringfy.length;
    let counterBlanks = 0;

    for ( let element of inputStringfy ) {
      if (element === ' ') {
        counterBlanks++;
      }
    }

    if (totalElements === counterBlanks) {
      return isBlank;
    }
    else {
      return isBlank = false;
    }
  } // end whiteSpaceController method ___________________________________________________________________

  fixtasksIds() {
    let counter = 1;
    const tasksCopy = Object.values(this.tasks);
    let updgradedTasks = new Object();

    for ( let value of tasksCopy ) {
      updgradedTasks[counter++] = value;
    }

    this.tasks = updgradedTasks;
    this.taskId = counter;
  } // end fixTasksIds method ___________________________________________________________________

  availableTask(id) {
    return Object.keys(this.tasks).includes(String(id));
  } // ___________________________________________________________________

  checkFirstCharacterNameFile(charToCheck) {
    const avoidASFirstChar = ['-', '_', '.', ' '];
  
    for ( let value of avoidASFirstChar ) {
      if (charToCheck === value) {
        return true;
      }
    }
    return false;
  } // end checkFirstCharacterNameFile ___________________________________________________________________

  forbiddenCharsNameFile(nameFile) {
    const avoidCharacters = [
      '#', '%', '&', '{', '}', '\\', '<', '>', '*', '?', '/', ' ',
      '$', '!', '\'', "\"", ":", "@", "+", "`", "|", '=', '.', ','
    ];

    for ( let char of nameFile ) {
      if (avoidCharacters.includes(char)) {
        return true;
      }  
    } 
    return false;
  } // end forbiddenCharsNameFile ___________________________________________________________________

  makeFile(name, tasksList) {
    let nameFile = name;
    const typeExtensionAllowed = '.txt';
    const date = new Date();
    const dateFormat = `DATE: ${date.toDateString()} ${date.toLocaleTimeString()}\n\n`;
    let body = dateFormat;

    if (path.extname(nameFile) === '') {
      nameFile = `${nameFile}${typeExtensionAllowed}`;
    }

    if (fs.readdirSync(__dirname).includes(nameFile)) {
      return true;
    } else {
      for (let [key, value] of Object.entries(tasksList)) {
        body += `${key}: ${value}\n`;
      }

      fs.writeFile(nameFile, body, (err, success) => {
        if (err) {
          throw err;
        } else {
          return true;
        }  
      });
    }

    // clear tasks object after create file
    for ( let prop of Object.getOwnPropertyNames(tasksList)) {
      delete tasksList[prop];
    }
  } // end makeFile method ___________________________________________________________________

  help() {
    this.emit('response', chalk.green(`Available Commands:\n
  add Task
  ls
  delete :id
  save\n`
    ));
  } // end help method ___________________________________________________________________

  add(args) {
    if (!args.join(' ')) { // no argument specified
      this.emit(
        'response', 
chalk.redBright(`Oops! Nothing to add. 
The add task require an item to upgrade the list.\n`)
      );
    }   else if (this.whiteSpaceController(args)) {
      this.emit(
        'response', 
chalk.redBright(`Oops! nothing to add.
A blank row is a good opportunity for an item in the list.\n`)
      );
    } else {
      this.tasks[this.taskId] = args.join(' ');
      this.emit('response', chalk.blueBright(`Added new task: ${this.taskId}\n`));
      this.taskId++;
    }
  } // end add method ___________________________________________________________________

  ls() {
    this.emit('response', chalk.blueBright(`Tasks list:\n\n${this.taskString()}\n`));
  }

  delete(args) {
    let argsTurnSting = String(args).trim();
    let argsTurnNumber = Number(argsTurnSting);

    if ((Number.isInteger(argsTurnNumber)) && (this.availableTask(argsTurnNumber))) {
      delete(this.tasks[argsTurnNumber]);
      this.fixtasksIds();
      this.emit('response', chalk.green(`Deleted task ${argsTurnNumber}\n`));
    } else {
      this.emit(
        'response', 
chalk.redBright(`Oops! Not found any reference to the ID: \'${args}\'
Are you sure your input was correct?\n
Type the \'ls\' command to make you sure to find your item.\n`)
      );
    }
  } // end delete method ___________________________________________________________________

  save(args) {
    const nameFile = args.join('');
    const avoidCharacters = [
      '#', '%', '&', '{', '}', '\\', '<', '>', '*', '?', '/', ' ',
      '$', '!', '\'', "\"", ":", "@", "+", "`", "|", '=', '.', ','
    ];

    if (args.join('') === '') { // no argument specified
      this.emit(
        'response', 
chalk.redBright(`Oops! No name file specified.\n`)
      );
    } else if (this.checkFirstCharacterNameFile(nameFile.charAt(0))) {
      this.emit(
        'response',
chalk.redBright(`Oops! This Character: ${nameFile.charAt(0)} is not allowed as first character of a name file.\n`)
      );
    } else if (Object.keys(this.tasks).length === 0) {
      this.emit(
        'response', 
        chalk.yellow('You got an empty list at the moment.\n')
      );
    } else if (this.forbiddenCharsNameFile(nameFile)) {
      this.emit(
        'response',
chalk.redBright(`Oops! The file name contains forbidden characters.\n`)
      );
    } else {
      let isFileExist = this.makeFile(nameFile, this.tasks);
      if (isFileExist) {
        this.emit(
          'response', 
chalk.redBright(`Oops! Some problem with creating the file.`)
        );
      } else {
        this.emit(
          'response', 
chalk.green.bold(`File written successfully!\n`)
        );
      }
    }
  } // end save method ___________________________________________________________________

  // show all the files with the .txt enxtension
  directory() {
    const directoryFiles = fs.readdirSync(__dirname);

    function searchTxtextExtension(directoryFiles) {
      return directoryFiles.filter((namefile, _) => {
       return path.extname(namefile) === '.txt';
      }).join('\n');
    }

    this.emit(
      'response',
chalk.greenBright(`Directory files:

${searchTxtextExtension(directoryFiles)}\n`)  
    );
  } // end directory method ___________________________________________________________________

} // end class

module.exports = (client) => new Server(client); 


