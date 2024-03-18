import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.API_KEY;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

app.listen(port,()=>{
    console.log(`Server is up and running at port ${port} `);
})
app.get('/',(req,res)=>{
    try {
        res.render("index.ejs");
    } catch (error) {
        console.error("Failed to make request: ",error.message);

    }
});
app.post('/info',async (req,res)=>{
    const location = req.body['locationKey'];
    try {
                                    // Location Key API
        const response1 = await axios.get("http://dataservice.accuweather.com/locations/v1/search",
        {
            params:{
                apikey:apiKey,
                q:location
            }
        });

        const result1 = response1.data; // JS Object so no need to parse it...
        const geoPosition=`${result1[0].GeoPosition.Latitude},${result1[0].GeoPosition.Longitude}`
        const locationKey = result1[0].Key;
                                    // Current Conditions API
        const response2 = await axios.get(`http://dataservice.accuweather.com/currentconditions/v1/${locationKey}`,{
            params:{
                apikey:apiKey,

            }
        });

        const result2=response2.data;
        const epochTime=result2[0].EpochTime;
        let date=new Date(epochTime*1000); //in ms
        const hours=date.getHours();
        const minutes=date.getMinutes();
        const seconds=date.getSeconds();
        const currentTime=hours+":"+minutes+":"+seconds;
        const weatherText=result2[0].WeatherText;
        const weatherIcon=result2[0].WeatherIcon;
        const precipitationData=result2[0].HasPrecipitation;
        const Temp=`${result2[0].Temperature.Metric.Value} ${result2[0].Temperature.Metric.Unit}`;
                                    // 5 Days of Daily Forecasts API
        const response3= await axios.get(`http://dataservice.accuweather.com/forecasts/v1/daily/5day/${locationKey}`,{
            params:{
                apikey:apiKey
            }
        });
        const result3=response3.data;
        const forecastHeadline=result3.Headline.Text;
        const forecastDate=(result3.DailyForecasts[1].Date).slice(0,10);
        const minForecastTemp=`${result3.DailyForecasts[1].Temperature.Minimum.Value} ${result3.DailyForecasts[1].Temperature.Minimum.Unit}`;
        const maxForecastTemp=`${result3.DailyForecasts[1].Temperature.Maximum.Value} ${result3.DailyForecasts[1].Temperature.Maximum.Unit}`;
        const dayForecast=result3.DailyForecasts[1].Day.IconPhrase;
        const precipitaionStatusDay=result3.DailyForecasts[1].Day.HasPrecipitation;
        const nightForecast=result3.DailyForecasts[1].Night.IconPhrase;
        const precipitaionStatusNight=result3.DailyForecasts[1].Night.HasPrecipitation;

        const finalData={
            Location:location,
            Time:currentTime,
            WeatherText:weatherText,
            Icon:weatherIcon,
            Precipitation:precipitationData,
            Temperature:Temp,
            GeoPosition:geoPosition,
            Headline:forecastHeadline,
            Date:forecastDate,
            minTemp:minForecastTemp,
            maxTemp:maxForecastTemp,
            dayCondition:dayForecast,
            dayPrecipitation:precipitaionStatusDay,
            nightCondition:nightForecast,
            nightPrecipitation:precipitaionStatusNight
        }
        res.render("info.ejs",{data:finalData});
    } catch (error) {
        console.error(`Failed to make request. ${error.message}`);
    }
})
