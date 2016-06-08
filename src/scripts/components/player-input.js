/**
 * This module sets up the player input component
 *
 */
import View from '../structures/view';
import { autobind } from 'core-decorators';
import EVENTS_PLAYER from '../events/player';
import socket from '../util/socket';
import SOUNDS from '../events/sounds';
import $ from 'jquery';

/**
 *
 * @constructor PlayerInput
 * @extends View
 * @description PlayerInput component
 *
 */
export default class PlayerInput extends View {

  /**
   *
   * @function beforeRender
   * @description Sets up false consts and empty obj for input values
   *
   */
  @autobind
  beforeRender() {
    this.answer1Submitted = 0;
    this.answer2Submitted = 0;
    this.inputValues = {};
  }

  /**
   *
   * @function initialize
   * @description When initialized, empty answers and set up consts for
   * input and container elements
   *
   */
  @autobind
  initialize() {
    this.clearAnswers();
    this.playerContainer = this.$element.find('.js-player-input-container');
    this.player1Container = this.$element.find('.js-player-one-container');
    this.player2Container = this.$element.find('.js-player-two-container');
    this.player1 = this.$element.find('.js-player-input-team-one');
    this.player2 = this.$element.find('.js-player-input-team-two');
    this.playerInput = this.$element.find('.js-player-input');
  }

  /**
   *
   * @function visible
   * @description Make sure inputs are clear and display the inputs after
   * question has animated.
   * @listens {EVENTS_PLAYER.PLAYER_INPUT}
   *
   */
  @autobind
  visible() {
    socket.clear();
    this.clearAnswers();
    this.$element.find('.js-player-input-visible').addClass('is-active');
    this.player1Container.addClass('is-active');
    this.player1.focus();
    this.player1.on('keyup', this.parseAnswers);
  }

  /**
   *
   * @function parseAnswers
   * @description If answer hasn't been submitted yet, grab players input data
   * @param {event} e - Socket event
   * @param {object} data = Socket data object
   *
   */
  @autobind
  parseAnswers(e, data) {
    if (e.currentTarget === this.player1[0] && this.answer1Submitted !== 2) {
      this.inputValues['player1Answer'] = this.player1.val();
      if (e.keyCode === 13) {
        this.answer1Submitted++;
        this.checkValues(1);
        this.player2Visible();
      } else {
        this.answer1Submitted = 0;
      }
    }
    if (e.currentTarget === this.player2[0] && this.answer2Submitted !== 2) {
      this.inputValues['player2Answer'] = this.player2.val();
      if (e.keyCode === 13) {
        this.answer2Submitted++;
        this.checkValues(2);
      } else {
        this.answer2Submitted = 0;
      }
    }
    this.onSocketMessage(data);
  }

  /**
   *
   * @function clearAnswers
   * @description make sure object is empty and no player input is submitted
   *
   */
  @autobind
  clearAnswers() {
    this.inputValues = {};
    this.answer1Submitted = 0;
    this.answer2Submitted = 0;
  }

  /**
   *
   * @function teardown
   * @description Stop listening to player input events and
   * remove submitted and active classes
   *
   */
  tearDown() {
    $(document).off(EVENTS_PLAYER.PLAYER_INPUT, this.parseAnswers);
    this.playerContainer.toArray().forEach((item) => {
      $(item).removeClass('is-submitted');
    });

    this.playerInput.toArray().forEach((item) => {
      $(item).removeClass('is-active');
    });
  }

  /**
   *
   * @function checkValues
   * @description When timer for the question runs out, get the players input
   * If player hasn't entered anything animate as necessary
   *
   */
  @autobind
  checkValues(player, timeout){
    this.playerContainer.toArray().forEach((item, i) => {
      const playerInput = $(item).find('.js-player-input');
      if (playerInput.val()  === 'enter your answer' || playerInput.val() === '') {
        if (player && player === i + 1) {
          $(item).removeClass('is-active');
          $(item).addClass('is-hidden');
        }
        if (timeout) {
          $(item).removeClass('is-active');
          $(item).addClass('is-hidden');
        }
      } else {
        if (player && player === i + 1) {
          $(item).addClass('is-submitted');
        }
        if (timeout) {
          $(item).addClass('is-submitted');
        }
      }
    });
  }

  /**
   *
   * @function displayAnswers
   * @description If an answer hasn't been submitted yet, display the
   * answer on screen, add active class to change color of text and hide any overflow
   * @param {string} player - player element
   * @param {string} answer - player's answer
   * @param {number} playerId - player 1 or 2
   * @param {boolean} answerSubmitted - has answer been submitted yet
   *
   */
  @autobind
  displayAnswers(player, answer, playerId, answerSubmitted) {
    if (answerSubmitted !== 2) {
      player.addClass('is-active');
    }
  }

  @autobind
  player2Visible() {
    this.answer1Submitted = 2;
    this.checkValues(1);
    this.player2Container.addClass('is-active');
    this.player2.focus();
    this.player1.off('keyup', this.parseAnswers);
    this.player2.on('keyup', this.parseAnswers);
  }

  /**
   *
   * @function onSocketMessage
   * @description Listens to socket to display and submit player answers
   * @param {object} data - socket data
   * @fires {EVENTS_PLAYER.ANSWER_SUBMITTED} To play a sound
   * @fires {EVENTS_PLAYER.KEYPRESS}
   *
   */
  @autobind
  onSocketMessage() {
    const obj = {
      answer1: this.inputValues.player1Answer,
      answer2: this.inputValues.player2Answer
    }

    if (obj.answer1) {
      this.displayAnswers(this.player1, obj.answer1, 1, this.answer1Submitted);
    }

    if (obj.answer2) {
      this.displayAnswers(this.player2, obj.answer2, 2, this.answer2Submitted);
    }

    if (this.answer1Submitted === 2) {
      $(document).trigger(EVENTS_PLAYER.ANSWER1_SUBMITTED);
    }

    if (this.answer1Submitted === 2 && this.answer2Submitted === 2) {
      $(document).trigger(EVENTS_PLAYER.ANSWER_SUBMITTED);
      $(document).off(EVENTS_PLAYER.PLAYER_INPUT, this.parseAnswers);
      $(document).off(EVENTS_PLAYER.KEYPRESS, obj);
      this.player2.off('keyup', this.parseAnswers);
    }

    $(document).trigger(EVENTS_PLAYER.KEYPRESS, obj);
  }

  /**
   *
   * @function render
   * @description Renders player input component markup
   *
   */
  render() {
    return this.parse`
      <div class="section-animate js-player-input-visible">
        <div class="player-input">
          <div class="player-input__container player-input__container--team-one js-player-one-container js-player-input-container">
            <label class="player-input__label" for="team-one">Player 1</label>
            <div class="player-input__checkmark"></div>
            <input type="text" name="player1Input" class="player-input__input js-player-input-team-one js-player-input" placeholder="enter your answer" />
          </div>
          <div class="player-input__container player-input__container--team-two js-player-two-container js-player-input-container">
            <label class="player-input__label" for="team-two">Player 2</label>
            <input type="text" name="player2Input" class="player-input__input player-input__input--right js-player-input-team-two js-player-input" placeholder="enter your answer" />
            <div class="player-input__checkmark"></div>
          </div>
        </div>
      </div>
    `;
  }
}
