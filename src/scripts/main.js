'use strict';

$(initialize);

/**
 * N先の数
 */
const fisrtTo = 10;

/**
 * 更新間隔
 */
const interval = 500;

/**
 * 更新間隔
 */
const streamControlDataPath = 'bin/StreamControl/streamcontrol.json';

/**
 * Player 1 勝敗
 */
const player1WinningAndLosing = {
    '0': '',
    '1': 'V',
    '2': '-',
};

/**
 * Player 2 勝敗
 */
const player2WinningAndLosing = {
    '0': '',
    '1': '-',
    '2': 'V',
};

/**
 * 初期化を行います。
 */
function initialize() {
    // 更新間隔で定期更新を行います。
    setInterval(update, interval);
}

/**
 * 更新を行います。
 */
function update() {
    // StreamControl の出力を取得します。
    $.get(streamControlDataPath, undefined, json => {
        const data = JSON.parse(json);

        // Player 1
        $('#player1-note').text(data.playerNote1);
        $('#player1-name').text(data.playerName1);

        // Player 2
        $('#player2-note').text(data.playerNote2);
        $('#player2-name').text(data.playerName2);

        // 勝敗
        let player1WinsCount = 0;
        let player2WinsCount = 0;
        for (let index = 1; index < fisrtTo * 2; index++) {
            const wins = data['wins' + index.toString()];
            $('#player1-wins' + index.toString()).text(player1WinningAndLosing[wins]);
            $('#player2-wins' + index.toString()).text(player2WinningAndLosing[wins]);

            player1WinsCount = player1WinsCount + (wins === '1' ? 1 : 0);
            player2WinsCount = player2WinsCount + (wins === '2' ? 1 : 0);
        }

        $('#player1-wins-count').text(player1WinsCount.toString());
        $('#player2-wins-count').text(player2WinsCount.toString());
    });
}