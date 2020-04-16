var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope, $timeout) {
    $scope.chatflow = "Volvo";
    var botui = new BotUI('my-botui-app');
    var leftchannel = [];
    var sessionid = "";
    var intent = "welcome";
    var currentstate = "syswelcome";
    var qid = 0;
    var topic = "";
    var usertext = "";
    var audioContext;
    var mediaRecorder;
    var filename = "welcome.wav";
    var resFileName = "";
    var speechtextorder = [];
    var speechtextordermsgs = [];
    var speechTextReqCount = -1;
    let chunks = [];
    var repeattext = "";
    var botText = "";
    var userid = localStorage.getItem("UserID");
    //qid = null
    time = new Date();
    end = 0;
    start = 0;
    // localStorage.setItem("session", sessionid);
    //to track the silence start time
    silenceStart = 0;

    //to check is intital recording in progress
    started = false;

    //to check is speech to text processing in progress
    isspeechToTextProcessingCnt = 0;

    //to check is response generation in progres
    isTextResponseGenerating = false;

    //to track the number of questions
    questCnt = 0;

    //to check is exam done
    isExamDone = false;

    miniSilenceStart = 0;

    isparentquestion = 0;
    isValidByteStream = false;

    var isTestEnd = 0;
    var socket = io.connect('localhost:5000');
    socket.on('connect', function () {
        console.log('Websocket connected!');
    });


    function getSessionID() {
        $.ajax({
            url: Url + "get_session_id?userid=" + localStorage.getItem("UserID"),
            type: 'GET',
            contentType: false,
            processData: false,
            success: function (res) {
                sessionid = res.sessionid;
                localStorage.setItem("session", sessionid);
                if (res.conver == null || res.conver == undefined || res.conver.length == 0) {
                    playAudio();
                }
                else {
                    setConversations(res.conver)
                }
            }
        })
    }

    function setConversations(conver) {
        var uname = localStorage.getItem("UserName").charAt(0).toUpperCase() + localStorage.getItem("UserName").slice(1);

        if (conver == null || conver == undefined || conver.length == 0) {
            playAudio()
        }
        else {
            for (var i = 0; i < conver.length; i++) {
                qid = conver[i].qid;
                usertext = conver[i].text;

                if (conver[i].question != '' && conver[i].question != null && conver[i].question != undefined) {
                    botui.message.bot({
                        content: conver[i].question,
                        user: "Jessica",
                        loading: true,
                        photo: true,
                        delay: 5
                    })

                    user_text_array = conver[i].text.split('@')

                    for (var j = 0; j < user_text_array.length; j++) {
                        if (user_text_array[j] != '' && user_text_array[j] != null && user_text_array[j] != undefined) {
                            botui.message.human({
                                content: user_text_array[j],
                                user: uname,
                                loading: true,
                                photo: '/images/' + localStorage.getItem("userimage"),
                                delay: 5
                            })
                        }
                    }
                }
            }
            playAudio();
        }
    }

    function setfileName(filename, text, location) {
        console.log('test')
        if (text == '' || text == undefined || text == null)
            return;
        $('#audSource').attr('src', Url + "get_voice_question_by_filename?filename=" + filename + "&location=" + location + "&sessionid=" + sessionid);

        $('#sysAudio').get(0).load();
        $('#sysAudio').get(0).play();

        if (filename != 'repeat.wav') {
            botText = text;
        }
        else {
            repeattext = text;
        }

        $('#startAudio').animate({
            scrollTop: $('#startAudio')[0].scrollHeight
        }, 500);
        currentstate = "userwelcome";
    }

    var vid1 = document.getElementById("sysAudio");

    vid1.onloadeddata = function () {

        if (resFileName == "repeat.wav") {
            botui.message.bot({
                content: repeattext,
                user: "Jessica",
                loading: true,
                photo: true,
                delay: 200,
            })
        }
        else {
            botui.message.bot({
                content: botText,
                user: "Jessica",
                loading: true,
                photo: true,
                delay: 200,
            })
        }
    };

    vid1.onended = function () {
        if (isparentquestion == 1) {
            playAudio()
            return;
        }
        start = 0;
        end = 0;
        silenceStart = 0;
        mediaRecorder.start();
        //mark the system start
        started = true;
    };

    $scope.obey = function test(id) {
        alert("hh");
        $scope.hide = !$scope.hide;
    };

    function playAudio() {

        if (isTestEnd == 1) {

            return;
        }
        speechtextorder = [];
        speechtextordermsgs = [];
        speechTextReqCount = -1
        var data = new FormData();
        data.append('topic', topic);
        data.append('usertext', usertext);
        data.append('qid', qid);
        data.append('currentstate', currentstate);
        data.append('sessionid', sessionid);
        data.append('intent', intent);
        data.append('userid', userid);
        data.append('bottext', botText);
        data.append('isparentquestion', isparentquestion)
        $.ajax({
            url: Url + "get_text_response",
            type: 'POST',
            data: data,
            contentType: false,
            processData: false,
            success: function (res) {

                if (res.qid !== 0 && res.qid !== '' && res.qid !== null && res.qid !== undefined) {
                    ++questCnt;
                    qid = res.qid;
                }
                isparentquestion = res.isparentquestion;
                usertext = "";
                topic = res.topic;

                isTestEnd = res.istestend

                if (isTestEnd == 1) {
                    isExamDone = true;
                    return;
                }
                resFileName = res.filename;
                setfileName(res.filename, res.question, res.location);
                isTextResponseGenerating = false;
            },
            error: function (xhr, status, error) {
                isTextResponseGenerating = false;

                console.log('error')
                console.log(xhr.responseText)
            }
        });

    }

    function sendstreamdata(audiostream) {
        ++speechTextReqCount;
        socket.emit('create', { "filedata": audiostream, "request_no": speechTextReqCount });
    }
    function readstreamdata() {
        if (mediaRecorder.state != 'inactive' && isValidByteStream == true) {
            mediaRecorder.requestData();
        }
    }

    socket.on('on_speech_text', function (msg) {
        OnSpeechToText(msg);
    });

    function sendfile(blob) {
        ++speechTextReqCount;
        var data = new FormData();
        data.append('audioFile', blob);
        data.append('sessionid', sessionid);
        data.append('intent', intent);
        data.append('currentstate', currentstate);
        data.append('qid', qid);
        data.append('requestno', speechTextReqCount)

        $.ajax({
            url: Url + "get_speech_text",
            type: 'POST',
            data: data,
            contentType: false,
            processData: false,
            success: function (data) {
                OnSpeechToText(data);
            },
            error: function (data) {
                --isspeechToTextProcessingCnt;
                console.log("speech to text error");
            }
        });
    }

    function OnSpeechToText(data) {
        --isspeechToTextProcessingCnt;
        data.requestno = Number(data.requestno);
        var uname = localStorage.getItem("UserName").charAt(0).toUpperCase() + localStorage.getItem("UserName").slice(1);

        //initial request
        if (speechtextorder.length == 0) {
            if (data.requestno != 0) {
                for (var i = 0; i <= data.requestno; i++) {
                    speechtextorder.push(-1)
                    speechtextordermsgs.push("")
                }
                speechtextorder[data.requestno] = 0;
                speechtextordermsgs[data.requestno] = data.text;
                return;
            }
            else {
                speechtextorder.push(1);
                speechtextordermsgs.push(data.text);

                if (data.text != '' && data.text != null && data.text != undefined) {
                    botui.message.human({
                        content: data.text,
                        user: uname,
                        loading: true,
                        photo: '/images/' + localStorage.getItem("userimage"),
                        delay: 200,
                    })
                }
            }
        }
        else {
            // for new requests and 
            if (data.requestno + 1 > speechtextorder.length) {
                for (var i = speechtextorder.length; i < data.requestno + 1; i++) {
                    speechtextorder.push(-1)
                    speechtextordermsgs.push("")
                }
                speechtextorder[data.requestno] = 0;
                speechtextordermsgs[data.requestno] = data.text;

                for (var i = 0; i < speechtextorder.length; i++) {
                    if (speechtextorder[i] == 0) {
                        speechtextorder[i] = 1;

                        if (speechtextordermsgs[i] != '' && speechtextordermsgs[i] != null && speechtextordermsgs[i] != undefined) {
                            botui.message.human({
                                content: speechtextordermsgs[i],
                                user: uname,
                                loading: true,
                                photo: '/images/' + localStorage.getItem("userimage"),
                                delay: 200,
                            })
                        }

                    }
                    else if (speechtextorder[i] == -1) {
                        break;
                    }
                }
            }
            else if (data.requestno + 1 < speechtextorder.length) {
                speechtextorder[data.requestno] = 0
                speechtextordermsgs[data.requestno] = data.text

                for (var i = 0; i < speechtextorder.length; i++) {
                    if (speechtextorder[i] == 0) {
                        speechtextorder[i] = 1;

                        if (speechtextordermsgs[i] != '' && speechtextordermsgs[i] != null && speechtextordermsgs[i] != undefined) {
                            botui.message.human({
                                content: speechtextordermsgs[i],
                                user: uname,
                                loading: true,
                                photo: '/images/' + localStorage.getItem("userimage"),
                                delay: 200,
                            })
                        }

                    }
                    else if (speechtextorder[i] == -1) {
                        break;
                    }
                }

            }
            else if (data.requestno + 1 == speechtextorder.length) {
                speechtextorder[data.requestno] = 0
                speechtextordermsgs[data.requestno] = data.text

                if (data.text != '' && data.text != null && data.text != undefined) {
                    botui.message.human({
                        content: data.text,
                        user: uname,
                        loading: true,
                        photo: '/images/' + localStorage.getItem("userimage"),
                        delay: 200,
                    })
                }
            }
        }

        if (data.text != "") {
            usertext = usertext + '@' + data.text;
        }
        $('#startAudio').animate({
            scrollTop: $('#startAudio')[0].scrollHeight
        }, 500);
    }



    $scope.evaluate = function () {
        isTextResponseGenerating = true;

        $.ajax({
            url: Url + "evaluate?sessionid=" + sessionid,
            type: 'GET',
            contentType: false,
            processData: false,
            success: function (data) {
                var list = {};
                $("#fullaudio").show();
                $scope.playFullAudio();
                localStorage.setItem("session", "");
                //$timeout(function () {

                for (var i = 0; i < data.length; i++) {
                    if (data[i].tscore >= 7)
                        data[i].tclass = "green"
                    else if (data[i].tscore >= 5)
                        data[i].tclass = "orange"
                    else if (data[i].tscore < 5)
                        data[i].tclass = "red"

                    if (data[i].escore >= 7)
                        data[i].eclass = "green"
                    else if (data[i].escore >= 5)
                        data[i].eclass = "orange"
                    else if (data[i].escore < 5)
                        data[i].eclass = "red"


                    if (parseFloat(data[i].escore) + parseFloat(data[i].tscore) >= 17)
                        data[i].teclass = "green"
                    else if (parseFloat(data[i].escore) + parseFloat(data[i].tscore) >= 12)
                        data[i].teclass = "orange"
                    else if (parseFloat(data[i].escore) + parseFloat(data[i].tscore) < 12)
                        data[i].teclass = "red"
                }

                $timeout(function () {
                    $scope.ScoreList = data;
                    if ($scope.ScoreList != null)
                        $("#legends").show();
                });

                $scope.totalTQ = 0;
                $scope.totalEQ = 0;
                for (var i = 0; i < data.length; i++) {
                    $scope.totalTQ = $scope.totalTQ + parseFloat(data[i].tscore);
                    $scope.totalEQ = $scope.totalEQ + parseFloat(data[i].escore);
                }
                $("#micimage").hide();
                $("#assessscore").show();
                $("#analysis").show();

                // alert('evaluated');
                console.log(list)
            }
        });
    }

    $scope.playFullAudio = function () {
        $('#simulateSource').attr('src', Url + "get_voice_question_by_filename?filename=" + sessionid + ".wav&location=blob");
        $('#simulateaudio').get(0).load();
        $('#simulateaudio').get(0).pause();
        //var vid = document.getElementById("simulateaudio");
        //vid.autoplay = false;
    }


    $scope.displaystart = function (selectedtopic) {
        topic = selectedtopic;
        $("#startsimulate").show();
        $("#selecttopic").hide();
        $("#startbutton").hide();
    }

    var convertFloat32ToInt16 = function (buffer) {
        ////console.log(buffer);
        //var l = buffer.length;
        //var point = Math.floor(l / 3);
        //var buf = new Int16Array(point);
        //for (var x = l; x > 0;) {
        //    var average = (buffer[x]);// + buffer[x - 1] + buffer[x - 2]) / 3;
        //    //console.log(average * 0x7fff);
        //    //console.log(average);
        //    //buf[point] = average * 0x7fff;
        //    buf[point] = Math.round(Math.abs(average * 0x7fff));
        //    //buf[point] = Math.round(Math.abs(average)) * 0x7fff;
        //    point -= 1;
        //    x -= 1;
        //}
        ////return buf.buffer;
        ////console.log('called')
        var wav = audioBufferToWav(buffer);
        buf = [new Uint8Array(wav)];
        return buf;

    }

    $scope.StartAssessment = function () {

        $("#startAudio").show();
        $("#micimage").show();
        $("#startbutton").hide();
        $("#startsimulate").hide();


        //  topic = selectedtopic;
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function (stream) {
                audioContext = new AudioContext({ sampleRate: 16000 });

                getSessionID();

                analyser = audioContext.createAnalyser();
                microphone = audioContext.createMediaStreamSource(stream);
                javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

                analyser.smoothingTimeConstant = 0.8;
                analyser.fftSize = 1024;

                mediaRecorder = new MediaRecorder(stream);
                //setInterval(readstreamdata,1000);


                mediaRecorder.ondataavailable = function (e) {
                    console.log('done')
                    tempChunk = [];
                    if (e.data.size <= 0)
                        return;
                    //tempChunk.push(e.data);


                    //sendstreamdata(chunks);
                    //return
                    if (isTextResponseGenerating === true)
                        return;
                    ////console.log(typeof e.data)
                    //sendstreamdata(stream);
                    //return
                    try {
                        var blob = new Blob([e.data], { 'type': 'audio/webm; codecs=opus' });
                        var fileReader = new FileReader();
                        fileReader.onload = function (event) {
                            arrayBuffer = event.target.result;
                        };
                        fileReader.readAsArrayBuffer(blob);
                        fileReader.onloadend = function (d) {
                            audioContext.decodeAudioData(
                                fileReader.result,
                                function (buffer) {
                                    var wav = audioBufferToWav(buffer);

                                    //sendstreamdata(new Blob([new Uint8Array(wav)]));
                                    sendstreamdata([new Uint8Array(wav)]);
                                    //sendstreamdata(blob);
                                },
                                function (e) { console.log(e); }
                            );
                        };
                    }
                    catch (err) {
                        console.log(err);
                    }
                }
                microphone.connect(analyser);
                analyser.connect(javascriptNode);
                javascriptNode.connect(audioContext.destination);
                javascriptNode.onaudioprocess = function (e) {

                    if (started === true && isTextResponseGenerating === false) {
                        var array = new Uint8Array(analyser.frequencyBinCount);
                        analyser.getByteFrequencyData(array);
                        var values = 0;

                        var length = array.length;
                        for (var i = 0; i < length; i++) {
                            values += (array[i]);
                        }

                        var average = values / length;

                        console.log(Math.round(average));
                        if (silenceStart > 0) {
                            time = new Date();
                            silenceend = time.getTime();

                            if (Math.abs(silenceStart - silenceend) / 1000 >= 4) {
                                if (isspeechToTextProcessingCnt <= 0) {
                                    isTextResponseGenerating = true;
                                    silenceStart = 0;
                                    if (mediaRecorder.state !== 'inactive') {
                                        mediaRecorder.stop();
                                    }
                                    playAudio();
                                }
                                return;
                            }
                        }
                        if (Math.round(average) > 20 && start === 0) {

                            isValidByteStream = true;
                            time = new Date();
                            start = time.getTime();
                            silenceStart = 0;
                        }
                        else if (start > 0 && Math.round(average) <= 20) {
                            isValidByteStream = false;
                            if (mediaRecorder.state === "inactive") {
                                return;
                            }

                            //socket.close();

                            time = new Date();
                            end = time.getTime();
                            //console.log(start, end, (Math.abs((start - end)) / 1000))
                            //if ((Math.abs((start - end)) / 1000) > 1) {
                            ++isspeechToTextProcessingCnt;
                            start = 0;
                            silenceStart = end;
                            end = 0;
                            console.log('inside');

                            //if (mediaRecorder.state == "inactive") {
                            //    --isspeechToTextProcessingCnt;
                            //    return;

                            //}
                            console.log('stopped');
                            mediaRecorder.stop();
                            mediaRecorder.start();

                            //}
                        }

                        //var mic = e.inputBuffer.getChannelData(0);

                        //if (isValidByteStream === true) {
                        //    var temp = convertFloat32ToInt16(e.inputBuffer);

                        //    leftchannel = leftchannel.concat(temp);
                        //    console.log(leftchannel);

                        //    //console.log(leftchannel);
                        //    //leftchannel.push(new Floa;t32Array(mic));
                        //    sendstreamdata(leftchannel);
                        //}

                    }
                }

            })
            .catch(function (err) {
                /* handle the error */
            });
    }
});
