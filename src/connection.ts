//
// IMPORTANT :
// - include `noLib: false` to your tsconfig.json file, under "compilerOptions"
//
///<reference lib="es2015.symbol" />
///<reference lib="es2015.symbol.wellknown" />
///<reference lib="es2015.collection" />
///<reference lib="es2015.iterable" />

import { Client, Room } from 'colyseus.js'
import { isPreviewMode, getCurrentRealm } from '@decentraland/EnvironmentAPI'
import { getUserData, UserData } from '@decentraland/Identity'

export let userData: UserData | null

export async function setUserData() {
    userData = await getUserData()
}

export async function connect(roomName: string, options: any = {}) {
    const isPreview = await isPreviewMode()
    const realm = await getCurrentRealm()

    //
    // make sure users are matched together by the same "realm".
    //
    if (isPreview) {
        options.realm = 'test'
    } else {
        options.realm = realm?.displayName
    }

    if (!userData) {
        await setUserData()
    }
    options.userData = userData

    log('data sent:', options)

    // const ENDPOINT = "wss://hept-j.colyseus.dev";
    const ENDPOINT = isPreview
        ? 'ws://127.0.0.1:2567' // local environment
        : 'wss://l9tio3.colyseus.dev' // production environment

    if (isPreview) {
        addConnectionDebugger(ENDPOINT)
    }
    const client = new Client(ENDPOINT)

    try {
        //
        // Docs: https://docs.colyseus.io/client/client/#joinorcreate-roomname-string-options-any
        //
        const room = await client.joinOrCreate<any>(roomName, options)
        if (isPreview) {
            updateConnectionDebugger(room)
        }

        return room
    } catch (e) {
        updateConnectionMessage(`Error: ${e.message}`, Color4.Red())
        throw e
    }
}

let message: UIText

function addConnectionDebugger(endpoint: string) {
    const canvas = new UICanvas()
    message = new UIText(canvas)
    message.fontSize = 15
    message.width = 120
    message.height = 30
    message.hTextAlign = 'center'
    message.vAlign = 'bottom'
    message.positionX = -80
    updateConnectionMessage(`Connecting to ${endpoint}`, Color4.White())
}

function updateConnectionMessage(value: string, color: Color4) {
    message.value = value
    message.color = color
}

function updateConnectionDebugger(room: Room) {
    updateConnectionMessage('Connected.', Color4.Green())
    room.onLeave(() => updateConnectionMessage('Connection lost', Color4.Red()))
}