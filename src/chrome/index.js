/* eslint-disable no-console */
import { CONFIG, REDUCERS } from '../constants';
import { Socket } from 'phoenix';
import { startPlugin } from '..';
import { setWorkerProfile } from '../actions';
import listenAuth from './listenAuth';
import handleWorkerStateNotifications from './handleWorkerStateNotifications';
import handleWork from './handleWork';
import handleStateSaving from './handleStateSaving';
import renderIcon from './renderIcon';
import startIdleChecking from './startIdleChecking';

export const startChromePlugin = (auth, pollUrl, chrome, enhancer, socketConstructor = Socket) => {
  const reloader = () => window.location.reload(true);
  const plugin = startPlugin({ auth, pollUrl, enhancer, reloader, socketConstructor });
  const store = plugin.getStore();

  const getStore = () => store;

  const getUserInfo = () => {
    chrome.identity.getProfileUserInfo((data) => {
      store.dispatch(setWorkerProfile(data));
    });
  };

  handleStateSaving(store, chrome);
  listenAuth(store, chrome);
  handleWorkerStateNotifications(store, chrome);
  renderIcon(store, chrome);
  handleWork(store, chrome);
  startIdleChecking(store, chrome);
  getUserInfo();

  if (CONFIG.env === 'dev') {
    // redux dev tools don't work with the plugin, so we have a dumb
    // replacement.
    store.subscribe(() => {
      const state = store.getState();
      console.log('\n**STATE**');
      REDUCERS.forEach(reducer => {
        console.log(`${reducer}: `, state[reducer].toJS());
      });
    });
  }

  return { getStore };
};
