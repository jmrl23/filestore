import { rename } from '@/modules/storage/utils/rename';

it('rename file', () => {
  const filename = rename('test.jpg');
  expect(filename).toMatch('test-');
  expect(filename).toMatch('.jpg');
  expect(filename).not.toMatch('test.jpg');
});
