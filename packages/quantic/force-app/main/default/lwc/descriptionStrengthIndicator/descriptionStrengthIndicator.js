import { LightningElement, api } from 'lwc';

/**
 * The `descriptionStrengthIndicator` component is a dynamic indicator that shows the user if their case description has enough details so far. It also give hints to the user as to what information they show include in the description. 
 * @example
 * <c-description-strength-indicator></c-description-strength-indicator>
 */
export default class DescriptionStrengthIndicator extends LightningElement {
  /**
   * The label to be shown to the user.
   * @api
   * @type {string}
   * @defaultValue `'Don’t know what to write?'`
   */
  @api helpLabel = 'Don’t know what to write?';

  /**
   * The initial message to be shown to the user.
   * @api
   * @type {string}
   * @defaultValue `'Provide details'`
   */
  @api initialMesssage = 'Provide details';

  /**
   * The message to be shown to encourage the user to keep going.
   * @api
   * @type {string}
   * @defaultValue `'Provide more details'`
   */
  @api keepGoingMessage = 'Provide more details';

  /**
   * The progress value from where the keepGoingMessage will be shown.
   * @api
   * @type {number}
   * @defaultValue `75`
   */
  @api keepGoingThreshold = 75;

  /**
   * The final message to be shown to the user when the progress indicator is full.
   * @api
   * @type {string}
   * @defaultValue `'Thank you!'`
   */
  @api finalMessage = "Thank you!";

  /** @type {number} */
  _progress = 0;

  get variant() {
    return this._progress < 100 ? 'warning' : 'base-autocomplete';
  }

  get message() {
    switch (true) {
      case (this._progress === 100):
        return this.finalMessage;
      case (this.keepGoingThreshold > 0 && this._progress >= this.keepGoingThreshold):
        return this.keepGoingMessage;
      default:
        return this.initialMesssage;
    }
  }

  /**
   * Tells if the progress indicator is full.
   * @api
   * @returns {boolean}
   */
  @api isFull() {
    return this._progress >= 100;
  }

  /**
   * Set the progress value.
   * @api
   * @param {number} progress - the progress value to be set.
   * @returns {void}
   */
  @api set progress(progress) {
    this._progress = Math.max(Math.min(progress, 100), 0);
  }

  /**
   * Returns the progress value.
   * @api
   * @returns {number}
   */
  get progress() {
    return this._progress;
  }
}