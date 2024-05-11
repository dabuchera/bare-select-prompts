const { Readable } = require('bare-stream');
const ansiEscapes = require('bare-ansi-escapes');
const KeyDecoder = require('bare-ansi-escapes/key-decoder');

const constants = {
  EOL: '\r\n',
};

/* - Raw input from the user is received through this.input
   - This input is handled by _oninput, which forwards it to the KeyDecoder for parsing
   - The KeyDecoder processes this input and, upon recognizing specific keys or patterns, emits 'data' events handled by _onkey
   - The output stream (this.output) is used to send processed responses or prompts back to the user, based on the logic in _onkey and other methods of the class
*/

const Selection =
  (module.exports =
  exports =
    class Selection extends Readable {
      constructor(opts = {}) {
        super();

        this._oninput = this._oninput.bind(this);
        this._onkey = this._onkey.bind(this);

        this._decoder = new KeyDecoder().on('data', this._onkey);

        this.input = opts.input.on('data', this._oninput);
        this.output = opts.output;
        this.line = '';
        this.cursor = 0;

        this.inMultiMode = false; // track if we are in multi-section mode
        this.choiceIndex = 0; // Index of the currently selected option
        this.options = opts.options; // Available options for choice

        this.on('data', this._online).resume();

        const optionsText = this.options
          .map((option, index) => {
            return (index === this.choiceIndex ? '[*] ' : '[ ] ') + option;
          })
          .join('\r\n');

        // Display the options and hide the cursor
        this.write(optionsText + constants.EOL + ansiEscapes.cursorHide);
      }

      close() {
        this.input.off('data', this._oninput);
        this.push(null);
      }

      write(data) {
        if (this.output) this.output.write(data);
      }

      clearLine() {
        this.write(constants.EOL);
        this.line = '';
        this.cursor = 0;
      }

      _oninput(data) {
        this._decoder.write(data);
      }

      _online(line) {
        this.emit('line', line); // For Node.js compatibility
      }

      _onkey(key) {
        // console.log(key);
        if (key.name === 'up') return this._onup();
        if (key.name === 'down') return this._ondown();

        let characters;

        switch (key.name) {
          case 'd':
            if (key.ctrl) return this.close();
            characters = key.shift ? 'D' : 'd';
            break;

          case 'c':
            if (key.ctrl) return this.close();
            characters = key.shift ? 'C' : 'c';
            break;

          case 'return': {
            const selectedOption = this.options[this.choiceIndex];
            this.write('\r\n' + ansiEscapes.colorBrightGreen + 'Selected option: ' + selectedOption + '\r\n' + ansiEscapes.modifierReset);
            this.clearLine();
            this.emit('selection', selectedOption);
            // show the cursor
            this.write(ansiEscapes.cursorShow);
            break;
          }

          case 'escape': {
            this.write('\r\n' + ansiEscapes.colorBrightRed + 'No option selected' + '\r\n' + ansiEscapes.modifierReset);
            this.clearLine();
            // show the cursor
            this.write(ansiEscapes.cursorShow);
            this.emit('selection', false);
            break;
          }

          default:
            return this._onup();
        }
      }

      _onup() {
        this.choiceIndex = (this.choiceIndex - 1 + this.options.length) % this.options.length;
        // Move cursor up to the start of options and erase everything below
        this.write(ansiEscapes.cursorUp(this.options.length) + ansiEscapes.eraseDisplayEnd);
        // Build the options text with the current selection marked
        const optionsText = this.options
          .map((option, index) => {
            return (index === this.choiceIndex ? '[*] ' : '[ ] ') + option;
          })
          .join('\r\n');
        // Display the options
        this.write(optionsText + constants.EOL);
      }

      _ondown() {
        this.choiceIndex = (this.choiceIndex + 1 + this.options.length) % this.options.length;
        // Move cursor up to the start of options and erase everything below
        this.write(ansiEscapes.cursorUp(this.options.length) + ansiEscapes.eraseDisplayEnd);
        // Build the options text with the current selection marked
        const optionsText = this.options
          .map((option, index) => {
            return (index === this.choiceIndex ? '[*] ' : '[ ] ') + option;
          })
          .join('\r\n');
        // Display the options
        this.write(optionsText + constants.EOL);
      }
    });

exports.createInterface = function createInterface(opts) {
  return new Selection(opts);
};

exports.constants = constants;
