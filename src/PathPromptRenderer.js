// @flow
import chalk from 'chalk';
import path from 'path';
import readline from 'readline';
import ScreenManager from 'inquirer/lib/utils/screen-manager';

import PathAutocomplete from './PathAutocomplete';

const RANGE_SIZE = 5;

/**
 * Render the path prompt UI based on a instance of { @link PathAutocomplete }
 */
export default class PathPromptRenderer {
  rl: ReadLineInterface;
  screen: ScreenManager;
  message: string;
  autocomplete: PathAutocomplete;

  constructor(
    rl: ReadLineInterface,
    screen: ScreenManager,
    autocomplete: PathAutocomplete,
    message: string,
    promptPrefix?: string,
  ) {
    this.rl = rl;
    this.screen = screen;
    this.message = message;
    this.promptPrefix = promptPrefix;
    this.autocomplete = autocomplete;
  }

  /**
   * Restore the state of the resources used by the renderer
   */
  kill(): void {
    this.screen.done();
  }

  /**
   * Render the prompt UI
   * @param [finalAnswer=null] If present, display the final answer
   */
  render(finalAnswer?: string): void {
    const message = this.buildMainContent(finalAnswer);
    const bottom = finalAnswer ? '' : this.buildBottomContent();
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
  renderNewPrompt(finalAnswer: string, autocomplete: PathAutocomplete) {
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
  renderError(error: string): void {
    this.screen.render(this.buildMainContent(), chalk.red('>> ') + error);
    this.resetCursor();
  }

  buildQuestionLine(): string {
    return chalk.green('?')
      + ' '
      + chalk.bold(this.message)
      + ' (supports '
      + chalk.green.bold('tab completion/selection')
      + ')';
  }

  buildInputLine(finalAnswer?: string): string {
    let relativePath = this.autocomplete.getActivePath().getRelativePath();
    return '  '
      + chalk.dim(this.promptPrefix || path.join(this.autocomplete.getWorkingDirectory().getBaseName(), '/'))
      + (finalAnswer ? chalk.cyan(relativePath) : relativePath);
  }

  /**
   * Render the main content of the prompt. The message includes the question and
   * the current response.
   * @param [finalAnswer=null] If present, display the final answer
   */
  buildMainContent(finalAnswer?: string): string {
    return this.buildQuestionLine() + '\n' + this.buildInputLine(finalAnswer);
  }

  /**
   * Render the bottom content of the prompt. It displays the current
   * selection state of the {@link PathAutocomplete} instance
   * @returns {string}
   */
  buildBottomContent(): string {
    const matches = this.autocomplete.getMatches();
    if (matches == null) {
      return '';
    }
    const matchIndex = this.autocomplete.getMatchIndex();
    const match = matches[matchIndex];

    const length = matches.length;
    let min = matchIndex - Math.floor(RANGE_SIZE / 2);
    let max = matchIndex + Math.ceil(RANGE_SIZE / 2);
    if (min < 0) {
      max = Math.min(length, max - min);
      min = 0;
    } else if (max >= length) {
      min = Math.max(0, min - (max - length));
      max = length;
    }

    const itemsToRender = matches.slice(min, max)
      .map((potentialPath) => {
        const suffix = (potentialPath.isDirectory() ? path.sep : '');
        if (potentialPath === match) {
          return chalk.black.bgWhite(potentialPath.getBaseName() + suffix);
        }
        const colorize = potentialPath.isDirectory() ? chalk.blue.bold : chalk.green;
        return colorize(potentialPath.getBaseName()) + suffix;
      });

    const separator = chalk.dim(new Array(20).join('─'));
    // itemsToRender.unshift(min ? chalk.dim(`(+ ${min} more above)`) : ' ');
    itemsToRender.unshift(separator);
    itemsToRender.push(matches.length - max ? chalk.dim(`(+ ${matches.length - max} more below)`) : ' ');
    // itemsToRender.push(separator);

    return itemsToRender.map(x => '  ' + x).join('\n');
  }

  /**
   * Reset the input cursor to the end of the line
   */
  resetCursor(): void {
    // Move the display cursor
    const activeEntry = this.autocomplete.getActivePath().getRelativePath();
    if (activeEntry === this.rl.line) {
      return;
    }

    const cursorPosition = (this.buildInputLine().length - chalk.dim(' ').length + 1) % this.rl.output.columns;

    this.rl.line = activeEntry;
    this.rl.output.unmute();
    readline.cursorTo(this.rl.output, cursorPosition);
    this.rl.cursor = activeEntry.length;
    this.rl.output.mute();
  }
}
