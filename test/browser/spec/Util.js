function Receiver() { }
Receiver.prototype.receive = function() { };

describe('Util', function() {
    it('can get a frame', function() {
        sink = new Receiver();
        spyOn(sink, 'receive');

        runs(function() {
            MM.getFrame(sink.receive);
        });

        waits(200);

        runs(function() {
            expect(sink.receive).toHaveBeenCalled();
        });
    });
});
