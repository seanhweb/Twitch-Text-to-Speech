var AWS = require('aws-sdk');
var polly = new AWS.Polly(); 
var s3 = new AWS.S3(); 

AWS.config.update({ region: 'us-west-1' });

exports.handler = function(event, context, callback) {
    let data = JSON.parse(event.body);
    const pollyParams = {
      OutputFormat: "mp3",
      Text: data.message,
      VoiceId: "Joanna"
    }
    const others = {
      id: data.id,
      user: data.user
    }
    // 1. Getting the audio stream for the text that user entered
    polly.synthesizeSpeech(pollyParams)
      .on("success", function (response) {
        let data = response.data;
        let audioStream = data.AudioStream;
        let s3BucketName = 'seanhweb-tts';
        // 2. Saving the audio stream to S3
        let params = {
          Bucket: s3BucketName,
          Key: others.id+'.mp3',
          Body: audioStream
        };
        s3.putObject(params)
          .on("success", function (response) {
            console.log("S3 Put Success!");
          })
          .on("complete", function () {
            console.log("S3 Put Complete!");
            let s3params = {
              Bucket: s3BucketName,
              Key: others.id+'.mp3',
            };
            // 3. Getting a signed URL for the saved mp3 file 
            let url = s3.getSignedUrl("getObject", s3params);
            // Sending the result back to the user
            let result = {
              bucket: s3BucketName,
              key: others.id+'.mp3',
              url: url
            };
            callback(null, {
              statusCode: 200,
              headers: {
                "Access-Control-Allow-Origin" : "*"
              },
              body: JSON.stringify(result)
            });
          })
          .on("error", function (response) {
            console.log(response);
          })
          .send();
      })
      .on("error", function (err) {
        callback(null, {
          statusCode: 500,
          headers: {
            "Access-Control-Allow-Origin" : "*"
          },
          body: JSON.stringify(err)
        });
      })
      .send();
};