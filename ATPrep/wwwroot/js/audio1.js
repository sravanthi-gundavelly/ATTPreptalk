var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope, $timeout) {
    $scope.chatflow = "Volvo";
    var botui = new BotUI('my-botui-app');

    var sessionchunk = [];
    var sessionid = "";
    var intent = "welcome";
    var currentstate = "syswelcome";
    var qid = 0;
    var topic = "";
    var usertext = "";
    var audioContext;
    var mediaRecorder;
    var filename = "welcome.wav";
    let chunks = []
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

    var isTestEnd = 0;
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
                botui.message.bot({
                    content: conver[i].question,
                    user: "Jessica",
                    loading: true,
                    photo: true,
                    delay: 200,
                })

                botui.message.human({
                    //content: res[i][1].replace(/@/g, "<br>"),
                    content: conver[i].text.replace(/@/g, "<br>"),
                    user: uname,
                    loading: true,
                    photo: '/images/' + localStorage.getItem("userimage"),
                    delay: 200,
                })
            }
        }
    }

    function setfileName(filename, text, location) {

        if (text == '' || text == undefined || text == null)
            return;
        $('#audSource').attr('src', Url + "get_voice_question_by_filename?filename=" + filename + "&location=" + location + "&sessionid=" + sessionid);

        $('#sysAudio').get(0).load();
        $('#sysAudio').get(0).play();
        botText = text;
        botui.message.bot({
            content: text,
            user: "Jessica",
            loading: true,
            photo: true,
            delay: 200,
        })
        $('#startAudio').animate({
            scrollTop: $('#startAudio')[0].scrollHeight
        }, 500);
        currentstate = "userwelcome";
    }

    var vid1 = document.getElementById("sysAudio");


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
        console.log('text to speech')

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
                if (res.qid != 0 && res.qid != '' && res.qid != null && res.qid != undefined) {
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


    function sendfile(blob) {
        var data = new FormData();
        data.append('audioFile', blob);
        data.append('sessionid', sessionid);
        data.append('intent', intent);
        data.append('currentstate', currentstate);
        data.append('qid', qid);
        console.log('speech to text', isspeechToTextProcessingCnt)
        $.ajax({
            url: Url + "get_speech_text",
            type: 'POST',
            data: data,
            contentType: false,
            processData: false,
            success: function (data) {
                --isspeechToTextProcessingCnt;
                console.log('speech to text done', isspeechToTextProcessingCnt)
                var uname = localStorage.getItem("UserName").charAt(0).toUpperCase() + localStorage.getItem("UserName").slice(1);

                if (data.text != "") {
                    usertext = usertext + '@' + data.text;
                    //if (uname.startsWith("Je")) {
                    botui.message.human({
                        content: data.text,
                        user: uname,
                        loading: true,
                        photo: '/images/' + localStorage.getItem("userimage"),
                        //   photo_path: '/images/callingperson_small.png',

                        delay: 200,
                    })
                }
                $('#startAudio').animate({
                    scrollTop: $('#startAudio')[0].scrollHeight
                }, 500);
            },
            error: function (data) {
                --isspeechToTextProcessingCnt;
                console.log("speech to text error");
            }
        });
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
        $('#simulateaudio').get(0).play();
    }


    $scope.displaystart = function (selectedtopic) {
        topic = selectedtopic;
        $("#startsimulate").show();
        $("#selecttopic").hide();
        $("#startbutton").hide();
    }

    $scope.StartAssessment = function () {

        $("#startAudio").show();
        $("#micimage").show();
        $("#startbutton").hide();
        $("#startsimulate").hide()

        //  topic = selectedtopic;
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function (stream) {
                audioContext = new AudioContext();

                getSessionID();

                analyser = audioContext.createAnalyser();
                microphone = audioContext.createMediaStreamSource(stream);
                javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

                analyser.smoothingTimeConstant = 0.8;
                analyser.fftSize = 1024;

                mediaRecorder = new MediaRecorder(stream);

                mediaRecorder.ondataavailable = function (e) {
                    chunks = []
                    chunks.push(e.data);

                    if (isTextResponseGenerating == true)
                        return;

                    var blob = new Blob(chunks, { 'type': 'audio/webm; codecs=opus' });
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

                                sendfile(new Blob([new Uint8Array(wav)]));
                            },
                            function (e) { console.log(e); }
                        );
                    };
                }
                microphone.connect(analyser);
                analyser.connect(javascriptNode);
                javascriptNode.connect(audioContext.destination);
                javascriptNode.onaudioprocess = function (e) {

                    if (started == true && isTextResponseGenerating == false) {
                        var array = new Uint8Array(analyser.frequencyBinCount);
                        analyser.getByteFrequencyData(array);
                        var values = 0;

                        var length = array.length;
                        for (var i = 0; i < length; i++) {
                            values += (array[i]);
                        }

                        var average = values / length;

                        //console.log(Math.round(average));
                        if (silenceStart > 0) {
                            time = new Date();
                            silenceend = time.getTime()

                            if (Math.abs(silenceStart - silenceend) / 1000 >= 4) {
                                if (isspeechToTextProcessingCnt <= 0) {
                                    isTextResponseGenerating = true;
                                    silenceStart = 0;
                                    if (mediaRecorder.state != 'inactive') {
                                        mediaRecorder.stop();
                                    }
                                    playAudio();
                                }
                                return;
                            }
                        }
                        if (Math.round(average) > 20 && start == 0) {
                            time = new Date();
                            start = time.getTime()
                            silenceStart = 0;
                        }
                        else if (start > 0 && Math.round(average) <= 5) {
                            if (mediaRecorder.state == "inactive") {
                                return;
                            }

                            time = new Date();
                            end = time.getTime()
                            //console.log(start, end, (Math.abs((start - end)) / 1000))
                            //if ((Math.abs((start - end)) / 1000) > 1) {
                            ++isspeechToTextProcessingCnt;
                            start = 0;
                            silenceStart = end;
                            end = 0
                            console.log('inside')

                            //if (mediaRecorder.state == "inactive") {
                            //    --isspeechToTextProcessingCnt;
                            //    return;

                            //}
                            mediaRecorder.stop();
                            mediaRecorder.start();

                            //}
                        }

                    }
                }

            })
            .catch(function (err) {
                /* handle the error */
            });
    }




});
