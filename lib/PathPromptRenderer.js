'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _readline = require('readline');

var _readline2 = _interopRequireDefault(_readline);

var _screenManager = require('inquirer/lib/utils/screen-manager');

var _screenManager2 = _interopRequireDefault(_screenManager);

var _PathAutocomplete = require('./PathAutocomplete');

var _PathAutocomplete2 = _interopRequireDefault(_PathAutocomplete);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RANGE_SIZE = 5;

/**
 * Render the path prompt UI based on a instance of { @link PathAutocomplete }
 */

var PathPromptRenderer = function () {
  function PathPromptRenderer(rl, screen, autocomplete, message, promptPrefix) {
    _classCallCheck(this, PathPromptRenderer);

    this.rl = rl;
    this.screen = screen;
    this.message = message;
    this.promptPrefix = promptPrefix;
    this.autocomplete = autocomplete;
  }

  /**
   * Restore the state of the resources used by the renderer
   */


  _createClass(PathPromptRenderer, [{
    key: 'kill',
    value: function kill() {
      this.screen.done();
    }

    /**
     * Render the prompt UI
     * @param [finalAnswer=null] If present, display the final answer
     */

  }, {
    key: 'render',
    value: function render(finalAnswer) {
      var message = this.buildMainContent(finalAnswer);
      var bottom = finalAnswer ? '' : this.buildBottomContent();
      this.screen.render(message, bottom);
      if (!finalAnswer) {
        // Reset the line value to match the state of the PathAutocomplete instance
        this.resetCursor();
      }
    }

    /**
     * Render the UI for a new prompt. It finalizes the current render,
     * inserts a new line and render a new path prompt.
     * @param finalAnswer
     * @param autocomplete The new autocomplete state instance
     */

  }, {
    key: 'renderNewPrompt',
    value: function renderNewPrompt(finalAnswer, autocomplete) {
      // Finalize the current render
      this.render(finalAnswer);
      // Add a new line to keep the rendered answer
      this.rl.output.unmute();
      this.rl.output.write('\n');
      this.rl.output.mute();
      this.autocomplete = autocomplete;
      // Render the new prompt
      this.render();
    }

    /**
     * Render the error UI
     * @param error
     */

  }, {
    key: 'renderError',
    value: function renderError(error) {
      this.screen.render(this.buildMainContent(), _chalk2.default.red('>> ') + error);
      this.resetCursor();
    }
  }, {
    key: 'buildQuestionLine',
    value: function buildQuestionLine() {
      return _chalk2.default.green('?') + ' ' + _chalk2.default.bold(this.message) + _chalk2.default.dim(' (supports ') + _chalk2.default.green.bold('tab completion/selection') + _chalk2.default.dim(')');
    }
  }, {
    key: 'buildInputLine',
    value: function buildInputLine(finalAnswer) {
      var relativePath = this.autocomplete.getActivePath().getRelativePath();
      return '  ' + _chalk2.default.dim(this.promptPrefix || _path2.default.join(this.autocomplete.getWorkingDirectory().getBaseName(), '/')) + (finalAnswer ? _chalk2.default.cyan(relativePath) : relativePath);
    }

    /**
     * Render the main content of the prompt. The message includes the question and
     * the current response.
     * @param [finalAnswer=null] If present, display the final answer
     */

  }, {
    key: 'buildMainContent',
    value: function buildMainContent(finalAnswer) {
      return this.buildQuestionLine() + '\n' + this.buildInputLine(finalAnswer);
    }

    /**
     * Render the bottom content of the prompt. It displays the current
     * selection state of the {@link PathAutocomplete} instance
     * @returns {string}
     */

  }, {
    key: 'buildBottomContent',
    value: function buildBottomContent() {
      var matches = this.autocomplete.getMatches();
      if (matches == null) {
        return '';
      }
      var matchIndex = this.autocomplete.getMatchIndex();
      var match = matches[matchIndex];

      var length = matches.length;
      var min = matchIndex - Math.floor(RANGE_SIZE / 2);
      var max = matchIndex + Math.ceil(RANGE_SIZE / 2);
      if (min < 0) {
        max = Math.min(length, max - min);
        min = 0;
      } else if (max >= length) {
        min = Math.max(0, min - (max - length));
        max = length;
      }

      var itemsToRender = matches.slice(min, max).map(function (potentialPath) {
        var suffix = potentialPath.isDirectory() ? _path2.default.sep : '';
        if (potentialPath === match) {
          return _chalk2.default.black.bgWhite(potentialPath.getBaseName() + suffix);
        }
        var colorize = potentialPath.isDirectory() ? _chalk2.default.blue.bold : _chalk2.default.green;
        return colorize(potentialPath.getBaseName()) + suffix;
      });

      var separator = _chalk2.default.dim(new Array(20).join('─'));
      // itemsToRender.unshift(min ? chalk.dim(`(+ ${min} more above)`) : ' ');
      itemsToRender.unshift(separator);
      itemsToRender.push(matches.length - max ? _chalk2.default.dim('(+ ' + (matches.length - max) + ' more below)') : ' ');
      // itemsToRender.push(separator);

      return itemsToRender.map(function (x) {
        return '  ' + x;
      }).join('\n');
    }

    /**
     * Reset the input cursor to the end of the line
     */

  }, {
    key: 'resetCursor',
    value: function resetCursor() {
      // Move the display cursor
      var activeEntry = this.autocomplete.getActivePath().getRelativePath();
      if (activeEntry === this.rl.line) {
        return;
      }

      var cursorPosition = (this.buildInputLine().length - _chalk2.default.dim(' ').length + 1) % this.rl.output.columns;

      this.rl.line = activeEntry;
      this.rl.output.unmute();
      _readline2.default.cursorTo(this.rl.output, cursorPosition);
      this.rl.cursor = activeEntry.length;
      this.rl.output.mute();
    }
  }]);

  return PathPromptRenderer;
}();

exports.default = PathPromptRenderer;