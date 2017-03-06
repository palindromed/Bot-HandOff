export default function (session, args, next) {
    session.send('Echo ' + session.message.text);
}
