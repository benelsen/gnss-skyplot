
import domReady from 'domready';

export default function () {

  return new Promise(function (resolve) {

    domReady(resolve);

  });

}
