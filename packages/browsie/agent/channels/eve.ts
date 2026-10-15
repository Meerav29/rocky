import { eveChannel } from "eve/channels/eve";
import { localDev, vercelOidc } from "eve/channels/auth";

import { browserChannelEvents } from "../lib/browser-runtime";

export default eveChannel({
  auth: [vercelOidc(), localDev()],
  events: browserChannelEvents,
});
