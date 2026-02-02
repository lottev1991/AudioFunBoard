<!doctype html>
<html>

<head>
    <script type="text/javascript" src="https://code.jquery.com/jquery-4.0.0.min.js"
        integrity="sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
        crossorigin="anonymous"></script>
    <script type="text/javascript" src="https://code.jquery.com/ui/1.14.2/jquery-ui.min.js"
        integrity="sha256-mblSWfbYzaq/f+4akyMhE6XELCou4jbkgPv+JQPER2M="
        crossorigin="anonymous"></script>
    <script type="text/javascript"
        src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui-touch-punch/0.2.3/jquery.ui.touch-punch.min.js"
        crossorigin="anonymous"></script>
    <script type="text/javascript" src="js/app.js"></script>
    <link rel="stylesheet" type="text/css" href="css/style.css" charset="utf-8">
    <link rel="manifest" href="manifest.json">
    <link rel="icon" type="image/x-icon" href="favicon.ico">
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(reg => console.log('Service Worker registered!'))
                    .catch(err => console.log('Registration failed: ', err));
            });
        }
    </script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body>
    <noscript>
        <p>To use this app, please make sure JavaScript is supported and enabled.</p>
        <style>
            #container {
                display: none;
            }
        </style>
    </noscript>
    <title>AudioFunBoard</title>
    <div id="container" alt="Container">
        <h1 id="pagetitle">AudioFunBoard</h1>
        <div id="main-sec">
            <button id="instr-btn">Instructions</button>
            <div id="instructions" title="Instructions">
                <ul>
                    <li>Click on each tab to switch to a different sound effects set.</li>
                    <li>Single-click on each button on the tab to play the sound.</li>
                    <li>Double-click (long-press on mobile) on each button to add the sound to the playlist at the bottom.</li>
                    <li>Double-click (long-press on mobile) on an item on the playlist to remove it again.</li>
                    <li>There are also options to:</li>
                    <ul>
                        <li>Play back the playlist.</li>
                        <li>Stop playing the playlist.</li>
                        <li>Reorder the playlist by dragging clips around.</li>
                        <li>Export the playlist to a local .wav file.</li>
                        <li>Clear the current playlist.</li>
                        <li>Save the current playlist in the browser.</li>
                        <li>Save the current playlist on a local hard drive as a .json file.</li>
                        <li>Choose a different playlist from the dropdown.</li>
                        <li>Duplicate the current playlist.</li>
                        <li>Delete the current playlist.</li>
                    </ul>

                </ul>
            </div>
            <div id="btn-sec" alt="Button section">
                <?php
                $ignore = array(".", "..", ".htaccess", ".DS_Store", "");
                $audioTabs = scandir("snd");
                echo "<ul id='tab-bar'>";

                foreach ($audioTabs as $key => $audioTab) {
                    $key = $key - 1;
                    if (! in_array($audioTab, $ignore)) {
                        echo "<li><a href='#tab-$key'><button>$audioTab</button></a></li>\n";
                    }
                }
                echo "</ul>";

                foreach ($audioTabs as $key => $audioTab) {
                    $key = $key - 1;
                    if (! in_array($audioTab, $ignore)) {

                        echo "<div id='tab-$key'>";

                        $sounds = scandir("snd/$audioTab");
                        foreach ($sounds as $soundfile) {
                            $sound = pathinfo($soundfile, PATHINFO_FILENAME);
                            $src = "snd/$audioTab/$soundfile";
                            if (! in_array($sound, $ignore)) {
                                echo "<audio class='audioclip' alt='$sound' id='$sound' src='$src'></audio>";
                                echo "<button id='btn-$sound' alt='Sound button' class='btn' data-target='$sound'>$sound</button>";
                            }
                        }
                        echo "</div>";
                    }
                }
                ?>
            </div>

            <div id="playlist-sec">
                <div id="playlist" alt="Playlist">
                    <!-- Here is where all the audio clips come. It's empty by default.-->
                </div>
                <div id="playlist-meta" alt="Playlist meta">
                    Last Saved: <span id="last-saved-date">Never</span>
                </div>
                <div id="controls">
                    <button id="play-playlist-btn" alt="Play playlist" title="Play playlist">▶</button>
                    <button id="stop-playlist-btn" alt="Stop playlist" title="Stop playlist">⏹</button>
                    <button id="export-btn" alt="Export to .wav file" title="Export to .wav file">💾 .wav</button>
                    <button id="clear-playlist-btn" alt="Clear current playlist" title="Clear current playlist">🗑️ Clear</button>
                </div>

            </div>

        </div>



        <hr>
        <div id="playlist-manager">
            <input type="text" id="new-playlist-name" placeholder="Playlist Name...">
            <button id="rename-playlist-btn" alt="Rename current playlist">✏️ Rename playlist</button>
            <button id="save-playlist-btn" alt="Save playlist in app">💾 Save in app</button>
            <button id="download-project-btn" alt="Save playlist to local drive (.json)">💾 Save to drive (.json)</button>


            <button id="import-trigger-btn" alt="Load playlist from local drive">📂 Load from drive</button>
            <input type="file" id="import-input" accept=".json" style="display:none;">
            <button id="duplicate-playlist-btn" alt="Duplicate playlist">👯‍♀️ Duplicate playlist</button>
            <div id="ps-parent">
                <label for="playlist-selector">Load playlist from browser:</label>
                <select id="playlist-selector" alt="Playlist load menu" title="Playlist load menu">
                    <option value="">-- Select a Playlist --</option>
                </select>
                <button id="delete-playlist-btn" alt="Delete playlist">🗑️ Delete</button>
            </div>

        </div>


    </div>
    <footer id="footer">
        <p>© Lotte V. Some rights reserved. | <a href="https://github.com/lottev1991/audiofunboard" target="_blank">Source code</a></p>
    </footer>
</body>

</html>