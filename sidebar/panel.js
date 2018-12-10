var myWindowId;
var contentBox = document.getElementById('content');

var path = '';
var param_list = [];

var divider_x = 150;
var divider_resize_mode = false;

function parseURL() {
  browser.tabs.query({windowId: myWindowId, active: true})
    .then((tabs) => {
      let a = document.createElement('a');
      a.href = tabs[0].url;

      path = a.origin + a.pathname;

      if(a.search.length > 1) {
        param_list = a.search.substring(1).split('&');
      } else {
        param_list = [];
      }
      updateContent();
    });
}

function prepareEncodingMap() {
  let charactersToEncode = '|:, ~/';
  let customEncodingMap = {};
  for(let i=0; i<charactersToEncode.length; i++) {
    let c = charactersToEncode.charAt(i);
    customEncodingMap[c] = encodeURIComponent(c);
  }
  return customEncodingMap;
}
var customEncodingMap = prepareEncodingMap();
var encodingCharacters = '[' + Object.keys(customEncodingMap).join('') + ']';

function customEncode(s) {
  return s.replace(encodingCharacters, function(m) { return customEncodingMap[m]; });
}

function customDecode(s) {
  for(let c in customEncodingMap) {
    s = s.replace(new RegExp(customEncodingMap[c], 'g'), c );
  }
  return s;
}

function addRow(key, val) {
  let w = document.getElementById('all').clientWidth;

  let div = document.createElement('DIV');
  div.className = 'param';

  let k = document.createElement('INPUT');
  k.className = 'key';
  k.style.width = divider_x + 'px';
  k.setAttribute('type', 'text');
  k.setAttribute('value', key);
  k.onkeyup = function(event) { if(event.keyCode == 13) doSubmit(false); }
  div.appendChild(k);

  let r = document.createElement('span');
  r.style.width = 2;
  r.style.height = k.style.height;
  r.style.cursor = 'col-resize';
  r.onmousedown = function() { divider_resize_mode = true; }
  let r_contents = document.createTextNode(' ');
  r.appendChild(r_contents);
  div.appendChild(r);

  let v = document.createElement('INPUT');
  v.className = 'val';
  v.style.width = (w - divider_x - 35) + 'px';
  v.setAttribute('type', 'text');
  let s = val;
  try {
    s = customDecode(val);
  } catch {}
  v.setAttribute('value', s);
  v.onkeyup = function(event) { if(event.keyCode == 13) doSubmit(false); }
  div.appendChild(v);

  let d = document.createElement('span');
  d.className = 'delete-span';
  d.style.width = '16px';
  d.style.height = '16px';
  d.style.color = "red";
  d.style.fontSize = "small";
  d.style.fontFamily = "Verdana";
  d.style.fontWeigth = "900";
  d.style.cursor = 'pointer';
  d.onclick = function() { contentBox.removeChild(div); }
  let d_contents = document.createTextNode('x');

  d.appendChild(d_contents);
  div.appendChild(d);
  contentBox.appendChild(div);
}

function updateContent() {
  while(contentBox.firstChild) {
      contentBox.removeChild(contentBox.firstChild);
  }

  document.getElementById('path').setAttribute('value', path);
  document.getElementById('path').onkeyup = function(event) { if(event.keyCode == 13) doSubmit(false); }

  for(let i=0; i<param_list.length; i++) {
    let pair = param_list[i].split('=');
    let key = (pair.length >= 1) ? pair[0] : '';
    let val = (pair.length >= 2) ? pair[1] : '';
    addRow(key, val);
  }

  resize_controls();
}

document.getElementById('add_row').onclick = function() { addRow('', ''); }

function collectParamDivs() {
  let param_divs = [];
  for(let i=0; i<contentBox.childNodes.length; i++) {
    if(contentBox.childNodes[i].className == 'param') {
      param_divs.push(contentBox.childNodes[i]);
    }
  }
  param_divs.sort(function(a, b) { return a.offsetTop - b.offsetTop; });

  return param_divs; 
}

function collectContents() {
  let contents = [];
  let param_divs = collectParamDivs();
  for(let i=0; i<param_divs.length; i++) {
    div = param_divs[i];
    let key, val;
    for (let i = 0; i < div.childNodes.length; i++) {
      if (div.childNodes[i].className == "key")  key = customEncode(div.childNodes[i].value);
      if (div.childNodes[i].className == "val")  val = customEncode(div.childNodes[i].value);
    }
    if(key.length && val.length) {
      contents.push(key + '=' + val);
    }
  }

  return contents;
}

function doSubmit(new_tab) {
  let url = document.getElementById('path').value + '?' + collectContents().join('&');

  let method = 'GET';
  /*
  let radios = document.getElementsByName('method');
  for(let i=0; i<radios.length; i++) {
    if(radios[i].checked) {
      method = radios[i].value;
      break;
    }
  }
  */

  browser.tabs.query({active: true, lastFocusedWindow: true}).then(
    (tabInfo) => {
      let curTabIndex = tabInfo[0].index;;
      if(method == 'GET') {
        var working = new_tab ? browser.tabs.create({url: url, index: curTabIndex + 1})
                              : browser.tabs.update({url: url});
        working.then(function(){}, function(){});
      } else {
        // todo
      }
    }
  );
}

function resize_controls() {
  let all = document.getElementById('all');
  let w = all.clientWidth;
  let h = all.clientHeight;

  var keys = document.getElementsByClassName('key');
  for(let k=0; k<keys.length; k++) {
    keys[k].style.width = divider_x + 'px';
  }

  var values = document.getElementsByClassName('val');
  for(let v=0; v<values.length; v++) {
    values[v].style.width = (w - 35 - divider_x) + 'px';
  }

  document.getElementById('submit').style.width = (w - 100) + 'px';

  let p = document.getElementById('path');
  p.style.left = '50px';
  p.style.top = '6px';
  p.style.width = (w - 60) + 'px';
}

document.getElementById('submit').onmouseup = function(event) {
  doSubmit(event.which == 2 ? true : event.shiftKey);
}

document.getElementById('sort').onclick = function() {
  param_list = collectContents();
  param_list.sort();
  updateContent();
}

window.addEventListener('mouseup', function() { divider_resize_mode = false; })

window.addEventListener('mousemove', function(event) {
  if(divider_resize_mode) {
    divider_x = event.clientX;
    resize_controls();
  } 
})

window.addEventListener('resize', resize_controls);

browser.tabs.onActivated.addListener(parseURL);

browser.tabs.onUpdated.addListener(function(tabId, changedInfo, tab) {
  if(changedInfo.status == 'complete') {
    parseURL(); 
  }
});

browser.windows.getCurrent({populate: true}).then((windowInfo) => {
  myWindowId = windowInfo.id;
  parseURL();
});
