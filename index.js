const WebSocket = require('ws');
const term = require('blessed');

const Gpmdp = function({host = 'localhost', port = 5672, connectionArgs = {perMessageDeflate: false}} = {}) {
    this.host = host;
    this.port = port;
    this.connectionArgs = connectionArgs;
    this.connected = false;
    this.screen = term.screen({smartCSR: true});
    this.screenApi = {
        updateTrackContainer: (track) => {}
    };
};

Gpmdp.prototype.init = function() {
    var p = new Promise((resolve, reject) => {
        this.initScreen();
        const ws = new WebSocket(`ws://${this.host}:${this.port}`, this.connectionArgs);
        ws.on('open', resolve);
        ws.on('message', (data) => this.messsageIn(JSON.parse(data)));
    });

    return p
        .then(() => (this.connected = true));
};

Gpmdp.prototype.initScreen = function() {
    const songContainer = term.text({
        content: 'Loading please wait ...',
        width: '100%',
        align: 'left',
        style: {
            bg: 'white',
            fg: 'black'
        }
    });
    const volContainer = term.text({
        content: 'Volume: 0',
        width: '100%',
        align: 'right',
        style: {
            bg: 'white',
            fg: 'black'
        }
    });
    const playTimeContainer = term.text({
        content: '0/0',
        width: '100%',
        align: 'right',
        style: {
            bg: 'white',
            fg: 'black'
        }
    });
    this.screenApi.updateTrackContainer = ({title, artist, album}) => (songContainer.setContent(`Playing: ${title}`) & this.screen.render());
    this.screenApi.updateVolume = (volume) => (volContainer.setContent(`Volume: ${volume}`) & this.screen.render());
    this.screenApi.updatePlayTime = ({current, total}) => (playTimeContainer.setContent(`${Math.floor((current / 1000) / 60)}:${Math.floor((current / 1000) % 60)}/${Math.floor((total / 1000) / 60)}:${Math.floor((total / 1000) % 60)}`) & this.screen.render());
    const layout = term.layout({
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        style: {
            bg: 'red'
        },
        children: [
            term.text({
                content: 'Gpmdp',
                width: '100%',
                align: 'center',
                style: {
                    bg: 'white',
                    fg: 'black'
                }
            }),
            term.line({
                orientation: 'horizontal',
                width: '100%',
                height: 'shrink'
            }),
            songContainer,
            term.line({
                orientation: 'horizontal',
                width: '100%',
                height: 'shrink'
            }),
            volContainer,
            term.line({
                orientation: 'horizontal',
                width: '100%',
                height: 'shrink'
            }),
            playTimeContainer
        ]
    });

    // Append our box to the screen.
    this.screen.append(layout);
    // Quit on Escape, q, or Control-C.
    this.screen.key(['escape', 'q', 'C-c'], function(ch, key) {
        return process.exit(0);
    });
    // Render the screen.
    this.screen.render();
};

Gpmdp.prototype.messsageIn = function({channel, payload}) {
    switch (channel) {
        case 'track':
            this.screenApi.updateTrackContainer(payload);
            break;
        case 'volume':
            this.screenApi.updateVolume(payload);
            break;
        case 'time':
            this.screenApi.updatePlayTime(payload);
            break;
    }
    // console.log('START========================================================');
    // console.log(channel, payload);
    // console.log('END========================================================');
};

var a = new Gpmdp();
a.init();