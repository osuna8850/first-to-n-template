'use strict';

$(initialize);

/**
 * StreamControl データのパス。
 * @const {string}
 */
const STREAM_CONTROL_DATA_PATH = 'http://localhost:8080/streamcontrol.json';

/**
 * 更新間隔 (ミリ秒)。
 * @const {number}
 */
const UPDATE_INTERVAL = 1000;

/**
 * フェードイン間隔 (ミリ秒)。
 * @const {number}
 */
const FADE_INTERVAL = 1000;

/**
 * 既定の StreamControl 対戦データ。
 * @const {object}
 */
const DEFAULT_MATCH_INFO = {
    /**
     * タイムスタンプ。
     * @type {string}
     */
    timestamp: undefined,
    /**
     * N 先の数。
     * @type {string}
     */
    firstTo: undefined,
};

/**
 * 勝敗。
 * @enum {string}
 */
const WinningAndLosingStrings = {
    NONE: '',
    WINNING: 'V',
    LOSING: '-',
};

/**
 * チェックボックスの状態。
 * @enum {string}
 */
const CheckBoxValues = {
    UNCHECKED: '0',
    CHECKED: '1',
};

/**
 * 既定の StreamControl 対戦データ。
 * @param {object}
 */
let matchInfo = DEFAULT_MATCH_INFO;

/**
 * 初期化を行います。
 */
function initialize() {
    // 更新間隔で定期更新を行います。
    setInterval(update, UPDATE_INTERVAL);
}

/**
 * 更新を行います。
 */
function update() {
    // StreamControl の出力を取得します。
    $.get(STREAM_CONTROL_DATA_PATH, undefined, response => {
        $('#error').fadeOut();

        // タイムスタンプに変更がない場合は処理しません。
        if (matchInfo.timestamp === response.timestamp) {
            return;
        }

        if (matchInfo.firstTo !== response.firstTo) {
            $('#player1-wins').empty();
            $('#player2-wins').empty();
        }

        // Player 1
        setVisible('#player1-note-area', matchInfo.playerNote1);
        setText('#player1-note', response.playerNote1, true);
        setVisible('#player1-note-area', response.playerNote1);
        setText('#player1-name', response.playerName1, true);

        // Player 2
        setVisible('#player2-note-area', matchInfo.playerNote2);
        setText('#player2-note', response.playerNote2, true);
        setVisible('#player2-note-area', response.playerNote2);
        setText('#player2-name', response.playerName2, true);

        // 勝敗
        let player1WinsCount = 0;
        let player2WinsCount = 0;
        const firstTo = parseInt(response.firstTo);
        for (let number = 1; number < firstTo * 2; number++) {
            const player1Winning = response[`wins${number}-1`] === CheckBoxValues.CHECKED;
            const player2Winning = response[`wins${number}-2`] === CheckBoxValues.CHECKED;

            const player1Wins = findAndCreateDivIfNotExists('player1-wins', number, firstTo);
            const player2Wins = findAndCreateDivIfNotExists('player2-wins', number, firstTo);

            setText(player1Wins, getWinningAndLosingString(player1Winning, player2Winning));
            setText(player2Wins, getWinningAndLosingString(player2Winning, player1Winning));

            player1WinsCount += player1Winning ? 1 : 0;
            player2WinsCount += player2Winning ? 1 : 0;
        }

        setText('#player1-wins-count', player1WinsCount.toString());
        setText('#player2-wins-count', player2WinsCount.toString());

        // StreamControl のデータをバックアップします。
        matchInfo = response;
    }).fail(() => {
        matchInfo = DEFAULT_MATCH_INFO;

        // Player 1
        setText('#player1-note', '');
        setText('#player1-name', '');

        // Player 2
        setText('#player2-note', '');
        setText('#player2-name', '');

        // 勝敗
        $('#player1-wins').empty();
        $('#player2-wins').empty();
        setText('#player1-wins-count', '');
        setText('#player2-wins-count', '');

        $('#error').fadeIn();
    });
}

/**
 * テキストを設定します。
 * @param {string} selector セレクター。
 * @param {string} text テキスト。
 * @param {boolean} hasScaleX X 軸のスケールがあるかどうか。
 */
function setText(selector, text, hasScaleX) {
    const element = $(selector);
    if (element.text() === text) {
        return;
    }

    element.hide();
    element.text(text);
    element.fadeIn(FADE_INTERVAL);

    if (hasScaleX) {
        const width = element.width();
        const parentWidth = element.parent().width();
        const ratio = width <= parentWidth ? 1 : parentWidth / width;
        element.css('transform', `scaleX(${ratio})`);
    }
}

/**
 * テキストが空の場合は非表示、そうでなければフェードインをします。
 * @param {string} selector セレクター。
 * @param {string} text テキスト。
 */
function setVisible(selector, text) {
    const element = $(selector);
    if (text === '') {
        element.hide();
    } else {
        element.fadeIn(FADE_INTERVAL);
    }
}

/**
 * 勝敗文字列を取得します。
 * @param {boolean} selfWinning 自身が勝利しているかどうか。
 * @param {boolean} otherWinning 相手が勝利しているかどうか。
 */
function getWinningAndLosingString(selfWinning, otherWinning) {
    if (selfWinning || otherWinning) {
        if (selfWinning) {
            return WinningAndLosingStrings.WINNING;
        } else {
            return WinningAndLosingStrings.LOSING;
        }
    } else {
        return WinningAndLosingStrings.NONE;
    }
}

/**
 * DIV を検索し、存在しなければ作成します。
 * @param {string} parentId 親要素の ID。
 * @param {number} number 番号。
 * @param {number} fisrtTo N 先の数。
 */
function findAndCreateDivIfNotExists(parentId, number, fisrtTo) {
    let div = $(`#${parentId}${number}`);
    if (div.length === 0) {
        div = $('<div>');
        div.appendTo($(`#${parentId}`));
        div.attr('id', `${parentId}${number}`);
        div.addClass('wins text-center');
        div.css('width', `${100 / (fisrtTo - 1)}%`)
    }

    return div;
}