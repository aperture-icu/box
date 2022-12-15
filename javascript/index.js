// setup date
function dateSet() {
    const dateElement = document.getElementById("date")
    dateElement.innerText = new Date().toLocaleString().replaceAll(".", "/")
}

dateSet()
setInterval(dateSet, 1000)

// setup lanyard
const LANYARD_WS = 'wss://api.lanyard.rest/socket'
const LANYARD_OP = {
    PRESENCE: 0,
    HELLO: 1,
    INITIALIZE: 2,
    HEARTBEAT: 3,
}
const EVENTS_TO_CALLBACK = ['INIT_STATE', 'PRESENCE_UPDATE']
const DISCORD_ID = "1013270483560579165"

function initializeLanyard(callback) {
    let ws = new WebSocket(LANYARD_WS)

    ws.onmessage = ({ data }) => {
        const received = JSON.parse(data)

        switch (received.op) {
            case LANYARD_OP.HELLO: {
                ws.send(JSON.stringify({ op: LANYARD_OP.INITIALIZE, d: { subscribe_to_id: DISCORD_ID } }))

                setInterval(() => {
                    ws.send(JSON.stringify({ op: LANYARD_OP.HEARTBEAT }));
                }, 1000 * 30)
            }

            case LANYARD_OP.PRESENCE: {
                if (EVENTS_TO_CALLBACK.includes(received.t)) {
                    callback(received.d)
                }
            }
        }
    }

    ws.onclose = () => initializeLanyard
}
initializeLanyard(({ discord_user, discord_status }) => {
    const { username, discriminator, avatar } = discord_user
    const colorCodes = {
        online: '#30d158',
        offline: '#8e8e93',
        idle: '#ffd60a',
        dnd: '#ff453a'
    }

    const usernameElement = document.getElementById("username")
    const avatarElement = document.getElementById("avatar")

    usernameElement.innerText = username + "#" + discriminator
    avatarElement.src = `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${avatar}.webp?size=256`
    avatarElement.style.borderColor = colorCodes[discord_status]
})