import { observable, computed, autorun } from 'mobx';
import { loadStorage } from '$utils/storage';

class Store {
  constructor() {
    this.init();
    autorun(() => console.log(this));
  }

  @observable sessions = [];

  // session list pagination
  @observable page = 0;

  @observable itemsPerPage = 5;

  @observable initialized = false;

  // init function to load from browser storage
  async init() {
    const sessions = await loadStorage('sessions')
      .catch((e) => {
        console.warn(e);
        return [];
      });

    this.sessions = sessions;
    this.initialized = true;
  }

  @computed get sessionsCount() {
    return this.sessions.length;
  }

  @computed get lastPage() {
    return Math.ceil(this.sessionsCount / this.itemsPerPage) - 1;
  }

  @computed get paginatedSessions() {
    return this.sessions
      .slice(this.page * this.itemsPerPage, (this.page * this.itemsPerPage) + this.itemsPerPage);
  }
}

const store = new Store();

export default store;
