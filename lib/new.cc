#include "./wrapped_re2.h"

#include <string>
#include <vector>


using std::string;
using std::vector;

using v8::Local;
using v8::RegExp;
using v8::String;
using v8::Value;

using node::Buffer;


NAN_METHOD(WrappedRE2::New) {
	NanScope();

	if (args.IsConstructCall()) {
		// process arguments

		vector<char> buffer;

		char*  data = NULL;
		size_t size = 0;

		bool ignoreCase = false;
		bool multiline = false;
		bool global = false;

		if (args.Length() > 1) {
			if (args[1]->IsString()) {
				Local<String> t(args[1]->ToString());
				buffer.resize(t->Utf8Length() + 1);
				t->WriteUtf8(&buffer[0]);
				size = buffer.size() - 1;
				data = &buffer[0];
			} else if (Buffer::HasInstance(args[1])) {
				size = Buffer::Length(args[1]);
				data = Buffer::Data(args[1]);
			}
			for (size_t i = 0; i < size; ++i) {
				switch (data[i]) {
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
			size = 0;
		}

		if (Buffer::HasInstance(args[0])) {
			size = Buffer::Length(args[0]);
			data = Buffer::Data(args[0]);
		} else if (args[0]->IsRegExp()) {
			const RegExp* re = RegExp::Cast(*args[0]);

			Local<String> t(re->GetSource());
			buffer.resize(t->Utf8Length() + 1);
			t->WriteUtf8(&buffer[0]);
			size = buffer.size() - 1;
			data = &buffer[0];

			RegExp::Flags flags = re->GetFlags();
			ignoreCase = bool(flags & RegExp::kIgnoreCase);
			multiline  = bool(flags & RegExp::kMultiline);
			global     = bool(flags & RegExp::kGlobal);
		} else if (args[0]->IsObject() && !args[0]->IsString()) {
			WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args[0]->ToObject());
			if (re2) {
				const string& pattern = re2->regexp.pattern();
				size = pattern.size();
				buffer.resize(size);
				data = &buffer[0];
				memcpy(data, pattern.data(), size);

				ignoreCase = re2->ignoreCase;
				multiline  = re2->multiline;
				global     = re2->global;
			}
		} else {
			Local<String> t(args[0]->ToString());
			buffer.resize(t->Utf8Length() + 1);
			t->WriteUtf8(&buffer[0]);
			size = buffer.size() - 1;
			data = &buffer[0];
		}

		RE2::Options options;
		options.set_case_sensitive(!ignoreCase);
		options.set_one_line(!multiline);

		// create and return an object

		WrappedRE2* re2 = new WrappedRE2(StringPiece(data, size), options, global, ignoreCase, multiline);
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
