require('dotenv').config()
const {Firestore} = require('@google-cloud/firestore');

const sg = require('@sendgrid/mail');
sg.setApiKey(process.env.SENDGRID_API_KEY);

const firestore = new Firestore();
exports.entry = async (event, context) => {
    const triggerResource = context.resource;

    console.log(`Function triggered by event on: ${triggerResource}`);
    console.log(`Event type: ${context.eventType}`); 

    const headline = `(pbhenson) ${getFirestoreValue(event, "headline")}`;
    const locations = getFirestoreValue(event, "location", "string[]");
    console.log("Headline:", headline);
    console.log("Locations:", locations);

    (await firestore.collection("subscribers").get()).forEach((doc, i) => {
        const sub = doc.data();

        const email = sub.email_address;
        const watchRegions = sub.watch_regions;
        
        if (watchRegions.some((x) => locations.includes(x))) {
            console.log(`An attempt will be made to notify the subscriber "${email}"`);
            sendEmail(email, {
                subject: headline,
                body: "A new deal with one of your subscribed watch regions was posted."
            }).then(() => {
                console.log(`Notified "${email}"`);
            }, (e) => {
                console.log(`Error Notifying "${email}"`);
                console.error(e);
            });
        }
    });
};

function getFirestoreValue(obj, fieldName, _type="string") {
    _type = _type.trim().toLowerCase();

    const type = _type.endsWith("[]") ? "array" : _type;
    const result = obj.value.fields[fieldName][type + "Value"];

    if (type === "array") {
        const elementType = _type.substring(0, _type.length - 2);
        return result.values.map((e) => e[elementType + "Value"]);
    } else {
        return result;
    }
}

function sendEmail(recipient, {
    subject="",
    body="",
    htmlBody=body
}={}) {
    const msg = {
        to: recipient,
        from: process.env.SENDGRID_SENDER,
        subject: subject,
        text: body,
        html: htmlBody
    };

    return sg.send(msg);
}