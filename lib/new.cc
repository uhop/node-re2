#include "./wrapped_re2.h"

#include <vector>


using std::vector;

using v8::Local;
using v8::Value;


NAN_METHOD(WrappedRE2::New) {
	NanScope();

	if (args.IsConstructCall()) {
		// process arguments

		NanUtf8String pattern(args[0]);

		bool ignoreCase = false;
		bool multiline = false;
		bool global = false;

		RE2::Options options;

		if (args.Length() > 1) {
			NanUtf8String flags(args[1]);
			const char* p = *flags;
			for (size_t i = 0, n = len(flags); i < n; ++i) {
				switch (p[i]) {
					case 'i':
						ignoreCase = true;
						break;
					case 'm':
						multiline = true;
						break;
					case 'g':
						global = true;
						break;
				}
			}
		}

		options.set_case_sensitive(!ignoreCase);
		options.set_one_line(!multiline);

		// create and return an object

		WrappedRE2* re2 = new WrappedRE2(StringPiece(*pattern, len(pattern)),
			options, global, ignoreCase, multiline);
		re2->Wrap(args.This());
		return args.This();
	}

	// call a constructor and return the result

	vector< Local<Value> > parameters(args.Length());
	for (size_t i = 0, n = args.Length(); i < n; ++i) {
		parameters[i] = args[i];
	}
    NanReturnValue(constructor->NewInstance(parameters.size(), &parameters[0]));
}
