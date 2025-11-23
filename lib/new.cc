#include "./wrapped_re2.h"
#include "./util.h"
#include "./pattern.h"

#include <map>
#include <memory>
#include <string>
#include <unordered_set>
#include <vector>

bool WrappedRE2::alreadyWarnedAboutUnicode = false;

static const char *deprecationMessage = "BMP patterns aren't supported by node-re2. An implicit \"u\" flag is assumed by the RE2 constructor. In a future major version, calling the RE2 constructor without the \"u\" flag may become forbidden, or cause a different behavior. Please see https://github.com/uhop/node-re2/issues/21 for more information.";

inline bool ensureUniqueNamedGroups(const std::map<int, std::string> &groups)
{
	std::unordered_set<std::string> names;

	for (auto group : groups)
	{
		if (!names.insert(group.second).second)
		{
			return false;
		}
	}

	return true;
}

NAN_METHOD(WrappedRE2::New)
{

	if (!info.IsConstructCall())
	{
		// call a constructor and return the result

		std::vector<v8::Local<v8::Value>> parameters(info.Length());
		for (size_t i = 0, n = info.Length(); i < n; ++i)
		{
			parameters[i] = info[i];
		}
		auto isolate = v8::Isolate::GetCurrent();
		auto p_tpl = Nan::GetIsolateData<Nan::Persistent<v8::FunctionTemplate>>(isolate);
		auto newObject = Nan::NewInstance(Nan::GetFunction(p_tpl->Get(isolate)).ToLocalChecked(), parameters.size(), &parameters[0]);
		if (!newObject.IsEmpty())
		{
			info.GetReturnValue().Set(newObject.ToLocalChecked());
		}
		return;
	}

	// process arguments

	std::vector<char> buffer;

	char *data = NULL;
	size_t size = 0;

	std::string source;
	bool global = false;
	bool ignoreCase = false;
	bool multiline = false;
	bool dotAll = false;
	bool unicode = false;
	bool sticky = false;
	bool hasIndices = false;

	auto context = Nan::GetCurrentContext();
	bool needFlags = true;

	if (info.Length() > 1)
	{
		if (info[1]->IsString())
		{
			auto isolate = v8::Isolate::GetCurrent();
			auto t = info[1]->ToString(Nan::GetCurrentContext());
			auto s = t.ToLocalChecked();
			size = s->Utf8Length(isolate);
			buffer.resize(size + 1);
			data = &buffer[0];
			s->WriteUtf8(isolate, data, buffer.size());
			buffer[size] = '\0';
		}
		else if (node::Buffer::HasInstance(info[1]))
		{
			size = node::Buffer::Length(info[1]);
			data = node::Buffer::Data(info[1]);
		}
		for (size_t i = 0; i < size; ++i)
		{
			switch (data[i])
			{
			case 'g':
				global = true;
				break;
			case 'i':
				ignoreCase = true;
				break;
			case 'm':
				multiline = true;
				break;
			case 's':
				dotAll = true;
				break;
			case 'u':
				unicode = true;
				break;
			case 'y':
				sticky = true;
				break;
			case 'd':
				hasIndices = true;
				break;
			}
		}
		size = 0;
		needFlags = false;
	}

	bool needConversion = true;

	if (node::Buffer::HasInstance(info[0]))
	{
		size = node::Buffer::Length(info[0]);
		data = node::Buffer::Data(info[0]);

		source = escapeRegExp(data, size);
	}
	else if (info[0]->IsRegExp())
	{
		const auto *re = v8::RegExp::Cast(*info[0]);

		auto isolate = v8::Isolate::GetCurrent();
		auto t = re->GetSource()->ToString(Nan::GetCurrentContext());
		auto s = t.ToLocalChecked();
		size = s->Utf8Length(isolate);
		buffer.resize(size + 1);
		data = &buffer[0];
		s->WriteUtf8(isolate, data, buffer.size());
		buffer[size] = '\0';

		source = escapeRegExp(data, size);

		if (needFlags)
		{
			v8::RegExp::Flags flags = re->GetFlags();
			global = bool(flags & v8::RegExp::kGlobal);
			ignoreCase = bool(flags & v8::RegExp::kIgnoreCase);
			multiline = bool(flags & v8::RegExp::kMultiline);
			dotAll = bool(flags & v8::RegExp::kDotAll);
			unicode = bool(flags & v8::RegExp::kUnicode);
			sticky = bool(flags & v8::RegExp::kSticky);
			hasIndices = bool(flags & v8::RegExp::kHasIndices);
			needFlags = false;
		}
	}
	else if (info[0]->IsObject() && !info[0]->IsString())
	{
		WrappedRE2 *re2 = nullptr;
		auto object = info[0]->ToObject(context).ToLocalChecked();
		if (!object.IsEmpty() && object->InternalFieldCount() > 0)
		{
			re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(object);
		}
		if (re2)
		{
			const auto &pattern = re2->regexp.pattern();
			size = pattern.size();
			buffer.resize(size);
			data = &buffer[0];
			memcpy(data, pattern.data(), size);
			needConversion = false;

			source = re2->source;

			if (needFlags)
			{
				global = re2->global;
				ignoreCase = re2->ignoreCase;
				multiline = re2->multiline;
				dotAll = re2->dotAll;
				unicode = true;
				sticky = re2->sticky;
				hasIndices = re2->hasIndices;
				needFlags = false;
			}
		}
	}
	else if (info[0]->IsString())
	{
		auto isolate = v8::Isolate::GetCurrent();
		auto t = info[0]->ToString(Nan::GetCurrentContext());
		auto s = t.ToLocalChecked();
		size = s->Utf8Length(isolate);
		buffer.resize(size + 1);
		data = &buffer[0];
		s->WriteUtf8(isolate, data, buffer.size());
		buffer[size] = '\0';

		source = escapeRegExp(data, size);
	}

	if (!data)
	{
		return Nan::ThrowTypeError("Expected string, Buffer, RegExp, or RE2 as the 1st argument.");
	}

	if (!unicode)
	{
		switch (unicodeWarningLevel)
		{
		case THROW:
			return Nan::ThrowSyntaxError(deprecationMessage);
		case WARN:
			printDeprecationWarning(deprecationMessage);
			break;
		case WARN_ONCE:
			if (!alreadyWarnedAboutUnicode)
			{
				printDeprecationWarning(deprecationMessage);
				alreadyWarnedAboutUnicode = true;
			}
			break;
		default:
			break;
		}
	}

	if (needConversion && translateRegExp(data, size, multiline, buffer))
	{
		size = buffer.size() - 1;
		data = &buffer[0];
	}

	// create and return an object

	re2::RE2::Options options;
	options.set_case_sensitive(!ignoreCase);
	options.set_one_line(!multiline); // to track this state, otherwise it is ignored
	options.set_dot_nl(dotAll);
	options.set_log_errors(false); // inappropriate when embedding

	std::unique_ptr<WrappedRE2> re2(new WrappedRE2(re2::StringPiece(data, size), options, source, global, ignoreCase, multiline, dotAll, sticky, hasIndices));
	if (!re2->regexp.ok())
	{
		return Nan::ThrowSyntaxError(re2->regexp.error().c_str());
	}
	if (!ensureUniqueNamedGroups(re2->regexp.CapturingGroupNames()))
	{
		return Nan::ThrowSyntaxError("duplicate capture group name");
	}
	re2->Wrap(info.This());
	re2.release();

	info.GetReturnValue().Set(info.This());
}
