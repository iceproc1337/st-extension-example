// The main script for the extension
// The following are examples of some basic extension functionality

import { promptQuietForLoudResponse, sendMessageAs, sendNarratorMessage } from '../../../slash-commands.js';

//You'll likely need to import extension_settings, getContext, and loadExtensionSettings from extensions.js
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";

//You'll likely need to import some other functions from the main script
import { saveSettingsDebounced, eventSource, event_types, chat } from "../../../../script.js";

// Keep track of where your extension is located, name should match repo name
const extensionName = "st-extension-example";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {};


 
// Loads the extension settings if they exist, otherwise initializes them to the defaults.
async function loadSettings() {
  //Create the settings if they don't exist
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  if (Object.keys(extension_settings[extensionName]).length === 0) {
    Object.assign(extension_settings[extensionName], defaultSettings);
  }

  // Updating settings in the UI
  $("#example_setting").prop("checked", extension_settings[extensionName].example_setting).trigger("input");
}

// This function is called when the extension settings are changed in the UI
function onExampleInput(event) {
  const value = Boolean($(event.target).prop("checked"));
  extension_settings[extensionName].example_setting = value;
  saveSettingsDebounced();
}

// This function is called when the button is clicked
function onButtonClick() {
  // You can do whatever you want here
  // Let's make a popup appear with the checked setting
  toastr.info(
    `The checkbox is ${extension_settings[extensionName].example_setting ? "checked" : "not checked"}`,
    "A popup appeared because you clicked the button!"
  );
}

async function httpPost(url, data) {
  try {
    const response = fetch(url, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    });

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    return error.message;
  }
}

async function handleMessage(msg) {
  console.log("processing msg: ", msg);

  let match_expression = /([a-zA-Z0-9_]+)\((.*?)\)/;
  let match_result = msg.match(match_expression);
  if (match_result) {
    let function_name = match_result[1];
    let parameters = match_result[2].split(",");

    let playbook = function_name;
    let playbook_result = await httpPost("/api/plugins/command-runner/ansible-playbook", { playbook, parameters });

    let prompt = playbook_result;
    let sendAs = "sys";

    sendNarratorMessage('', prompt);
    promptQuietForLoudResponse(sendAs, '');
  }
}

async function onMessageReceived(dataId) {
  const msg = chat[dataId].mes
  console.log("received msg: ", msg)
  await handleMessage(msg);
}

async function onMessageUpdated(dataId) {
  const msg = chat[dataId].mes
  console.log("updated msg: ", msg)
  await handleMessage(msg);
}

async function onStreamTokenReceived(text) {
  const msg = text
  console.log("received stream token: ", msg)
}

async function onGenerationEnded() {

}

// This function is called when the extension is loaded
jQuery(async () => {
  // This is an example of loading HTML from a file
  const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);

  // Append settingsHtml to extensions_settings
  // extension_settings and extensions_settings2 are the left and right columns of the settings menu
  // Left should be extensions that deal with system functions and right should be visual/UI related 
  $("#extensions_settings").append(settingsHtml);

  // These are examples of listening for events
  $("#my_button").on("click", onButtonClick);
  $("#example_setting").on("input", onExampleInput);

  // Load settings when starting things up (if you have any)
  loadSettings();
});


eventSource.on(event_types.MESSAGE_RECEIVED, onMessageReceived);
eventSource.on(event_types.STREAM_TOKEN_RECEIVED, onStreamTokenReceived);
// For debug
eventSource.on(event_types.MESSAGE_UPDATED, onMessageUpdated);
eventSource.on(event_types.GENERATION_ENDED, onGenerationEnded);
