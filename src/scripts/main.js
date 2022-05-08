'use strict';

$(initialize);

/**
 * StreamControl JSON ファイルの名前。
 * @const {string}
 */
const STREAM_CONTROL_FILE_NAME = 'streamcontrol.json';

/**
 * StreamControl JSON ファイルの URL。
 * @const {string}
 */
const STREAM_CONTROL_FILE_URL = `bin/StreamControl/${STREAM_CONTROL_FILE_NAME}`;

/**
 * 更新間隔 (ミリ秒)。
 * @const {number}
 */
const UPDATE_INTERVAL = 1000;

/**
 * フェード時間 (ミリ秒)。
 * @const {number}
 */
const FADE_DURATION = 1000;

/**
 * メインの表示時間 (ミリ秒)。
 * @const {number}
 */
const MAIN_DISPLAY_DURATION = 10000;

/**
 * サブの表示時間 (ミリ秒)。
 * @const {number}
 */
const SUB_DISPLAY_DURATION = 5000;

/**
 * エラーメッセージ HTML。
 * @const {string}
 */
const ERROR_MESSAGE_HTML = `Error: "${STREAM_CONTROL_FILE_URL}" is not found.`;

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
let matchInfo;

/**
 * 中止コントローラー。
 * @param {object}
 */
let abortController;

/**
 * 初期化を行います。
 */
function initialize() {
    // 起動時の表示アニメーションを設定します。
    $('.player1.border').effect('slide', { direction: 'left' }, FADE_DURATION);
    $('.player2.border').effect('slide', { direction: 'right' }, FADE_DURATION);

    // 更新間隔で定期更新を行います。
    setInterval(update, UPDATE_INTERVAL);
}

/**
 * 更新を行います。
 */
function update() {
    const url = `${STREAM_CONTROL_FILE_URL}?v=${Date.now()}`;

    // StreamControl の出力を取得します。
    $.get(url, undefined, async (response) => {
        $('#message').fadeOut(FADE_DURATION);

        // タイムスタンプに変更がない場合は処理しません。
        if (matchInfo?.timestamp === response.timestamp) {
            return;
        }

        if (
            matchInfo !== undefined &&
            matchInfo?.firstTo !== response.firstTo
        ) {
            await fadeOutAndToEmpty('#player1-wins, #player2-wins');
        }

        abortController?.abort();
        abortController = new AbortController();

        // Player 1
        setVisible('#player1-note-area', matchInfo?.playerNoteMain1);
        setTextRotation(
            '#player1-note',
            response.playerNoteMain1,
            response.playerNoteSub1,
            abortController.signal
        );
        setTextRotation(
            '#player1-name',
            response.playerNameMain1,
            response.playerNameSub1,
            abortController.signal
        );
        setVisible('#player1-note-area', response.playerNoteMain1);

        // Player 2
        setVisible('#player2-note-area', matchInfo?.playerNoteMain2);
        setTextRotation(
            '#player2-note',
            response.playerNoteMain2,
            response.playerNoteSub2,
            abortController.signal
        );
        setTextRotation(
            '#player2-name',
            response.playerNameMain2,
            response.playerNameSub2,
            abortController.signal
        );
        setVisible('#player2-note-area', response.playerNoteMain2);

        // 勝敗
        let player1WinsCount = 0;
        let player2WinsCount = 0;
        const firstTo = parseInt(response.firstTo);
        for (let number = 1; number < firstTo * 2; number++) {
            const player1Winning =
                response[`wins${number}-1`] === CheckBoxValues.CHECKED;
            const player2Winning =
                response[`wins${number}-2`] === CheckBoxValues.CHECKED;

            const player1WinsString = getWinningAndLosingString(
                player1Winning,
                player2Winning
            );
            const player2WinsString = getWinningAndLosingString(
                player2Winning,
                player1Winning
            );

            const player1Wins = findAndCreateDivIfNotExists(
                'player1-wins',
                number,
                firstTo,
                player1WinsString
            );
            const player2Wins = findAndCreateDivIfNotExists(
                'player2-wins',
                number,
                firstTo,
                player2WinsString
            );

            setText(player1Wins, player1WinsString);
            setText(player2Wins, player2WinsString);

            player1WinsCount += player1Winning ? 1 : 0;
            player2WinsCount += player2Winning ? 1 : 0;
        }

        setText('#player1-wins-count', player1WinsCount.toString());
        setText('#player2-wins-count', player2WinsCount.toString());

        // StreamControl JSON データをバックアップします。
        matchInfo = response;
    }).fail(async () => {
        matchInfo = undefined;

        abortController?.abort();

        // Player 1
        setText('#player1-note', '');
        setText('#player1-name', '');

        // Player 2
        setText('#player2-note', '');
        setText('#player2-name', '');

        // 勝敗
        await fadeOutAndToEmpty('#player1-wins, #player2-wins');
        setText('#player1-wins-count', '');
        setText('#player2-wins-count', '');

        // エラーメッセージ
        setText('#message', ERROR_MESSAGE_HTML, 'error', true);
    });
}

/**
 * 指定の時間だけスリーブします。
 * @param {number} milliSeconds ミリ秒。
 * @param {AbortSignal} signal 中止シグナル。
 */
function delay(milliSeconds, signal) {
    return new Promise((resolve, reject) => {
        const onSetTimeout = setTimeout(() => {
            resolve();
            signal?.removeEventListener('abort', onAbort);
        }, milliSeconds);

        const onAbort = () => {
            clearTimeout(onSetTimeout);
            reject(new DOMException('Aborted.', 'AbortError'));
        };

        signal?.addEventListener('abort', onAbort);
    });
}

/**
 * フェードアウトして、要素の中身を空にします。
 * @param {string} selector セレクター。
 */
async function fadeOutAndToEmpty(selector) {
    const div = $(selector);
    div.fadeOut(FADE_DURATION);
    await delay(FADE_DURATION);
    div.empty();
    div.show();
}

/**
 * テキストを設定します。
 * @param {string} selector セレクター。
 * @param {string} text テキスト。
 * @param {string} subText サブテキスト。
 * @param {AbortSignal} signal 中止シグナル。
 */
async function setTextRotation(selector, text, subText, signal) {
    if (subText === '') {
        subText = text;
    }

    try {
        setText(selector, text, undefined, false, true, signal);
        await delay(MAIN_DISPLAY_DURATION, signal);

        setText(selector, subText, undefined, false, true, signal);
        await delay(SUB_DISPLAY_DURATION, signal);

        setTextRotation(selector, text, subText, signal);
    } catch (e) {
        if (e.name === 'AbortError') {
            // 処理を終了します。
            return;
        } else {
            // エラーを再スローします。
            throw e;
        }
    }
}

/**
 * テキストを設定します。
 * @param {string} selector セレクター。
 * @param {string} text テキスト。
 * @param {string} addingClass 追加する CSS クラス。
 * @param {boolean} isHtml HTML かどうか。
 * @param {boolean} adjustScaleX X 軸のスケールを調整するかどうか。
 * @param {AbortSignal} signal 中止シグナル。
 */
async function setText(
    selector,
    text,
    addingClass,
    isHtml,
    adjustScaleX,
    signal
) {
    const element = $(selector);

    // テキストが同一の場合は何もしません。
    if (isHtml) {
        if (element.html() === text) {
            return;
        }
    } else if (element.text() === text) {
        return;
    }

    // フェードアウトします。
    element.fadeOut(FADE_DURATION);
    try {
        await delay(FADE_DURATION, signal);
    } catch (e) {
        if (e.name === 'AbortError') {
            // 処理を終了します。
            return;
        } else {
            // エラーを再スローします。
            throw e;
        }
    }

    // テキストを変更します。
    if (isHtml) {
        element.html(text);
    } else {
        element.text(text);
    }

    if (addingClass !== undefined) {
        element.addClass(addingClass);
    }

    // フェードインします。
    element.fadeIn(FADE_DURATION);

    // X 軸のスケールを調整します。
    if (adjustScaleX) {
        const width = element.width();
        const parentWidth = element.parent().width();
        const ratio = width <= parentWidth ? 1 : parentWidth / width;
        element.css('transform', `scaleX(${ratio})`);
    }
}

/**
 * テキストが空の場合はフェードアウト、そうでなければフェードインをします。
 * @param {string} selector セレクター。
 * @param {string} text テキスト。
 */
function setVisible(selector, text) {
    const element = $(selector);
    if (text === '') {
        element.fadeOut(FADE_DURATION);
    } else {
        element.fadeIn(FADE_DURATION);
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
 * @param {string} text テキスト。
 */
function findAndCreateDivIfNotExists(parentId, number, fisrtTo, text) {
    let div = $(`#${parentId}${number}`);
    if (div.length === 0) {
        div = $('<div>');
        div.appendTo($(`#${parentId}`));
        div.attr('id', `${parentId}${number}`);
        div.addClass('wins text-center');
        div.css('width', `${100 / (fisrtTo - 1)}%`);
        if (text !== '') {
            div.css('display', 'none');
        }
    }

    return div;
}
