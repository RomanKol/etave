import { observable, computed, autorun } from 'mobx';
import { loadStorage } from '../utils/storage';

class Store {
  @observable sessions = [];

  constructor() {
    this.init();
    autorun(() => console.log(this));
  }

  // init function to load from browser storage
  async init() {
    const sessions = await loadStorage('sessions')
      .catch((e) => {
        console.warn(e);
        return [];
      });

    this.sessions = sessions;

    console.log(this.sessions);
  }
}

const store = new Store();

export default store;
