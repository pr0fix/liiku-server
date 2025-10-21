import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import axios from "axios";
import { REALTIME_API_URL } from "../utils/constants";

const fetchRealtimeData = async () => {
  try {
    const response = await axios({
      method: "get",
      url: REALTIME_API_URL,
      responseType: "arraybuffer",
    });

    if (response.status !== 200) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }
    const buffer = response.data;
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(buffer)
    );
    return feed;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export default { fetchRealtimeData };
