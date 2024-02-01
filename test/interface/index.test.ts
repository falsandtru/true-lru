import { TLRU } from '../../index';

describe('Interface: Package', function () {
  describe('global', function () {
    it('global', function () {
      // @ts-ignore
      assert(global['TLRU'] !== Cache);
    });
  });

  describe('TLRU', function () {
    it('TLRU', function () {
      assert(typeof TLRU === 'function');
    });
  });

});
