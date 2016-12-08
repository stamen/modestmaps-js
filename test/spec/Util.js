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

    it('coerces strings into layers', function() {
        expect(MM.coerceLayer('http://openstreetmap.org/{Z}/{X}/{Y}.png') instanceof MM.Layer).toEqual(true);
    });

    it('coerces providers into layers', function() {
        expect(MM.coerceLayer(new MM.Template('http://openstreetmap.org/{Z}/{X}/{Y}.png')) instanceof MM.Layer).toEqual(true);
    });

});
